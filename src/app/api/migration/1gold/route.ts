// LendOS - 1GOLD Data Migration Engine
// Đọc file CSV từ phần mềm 1gold.biz và chuyển đổi sang LendOS database
//
// Cấu trúc cột CSV đầu vào:
//   Mã HĐ | Tên KH | SĐT | Tiền vay | Lãi Phí | Ngày vay | Ngày hết hạn
//   Đồ cầm | Tiền lãi đã đóng | Ngày đóng lãi tiếp theo | CMND | Địa chỉ
// ─────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import Papa from 'papaparse';

// ──────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────

interface MigrationRow {
  'Mã HĐ'?:                    string;
  'Tên KH'?:                    string;
  'SĐT'?:                       string;
  'Tiền vay'?:                  string;
  'Lãi Phí'?:                   string;
  'Ngày vay'?:                  string;
  'Ngày hết hạn'?:              string;
  'Đồ cầm'?:                    string;
  'Tiền lãi đã đóng'?:          string;
  'Ngày đóng lãi tiếp theo'?:   string;
  'CMND'?:                      string;
  'Địa chỉ'?:                   string;
  [key: string]: string | undefined;
}

interface MigrationResult {
  total:   number;
  success: number;
  skipped: number;
  errors:  { row: number; code: string; reason: string }[];
}

// ──────────────────────────────────────────────
// PARSER FUNCTIONS
// ──────────────────────────────────────────────

/**
 * Bóc tách chuỗi tiền tệ → số thực
 * "10,000,000" → 10000000
 * "1.500.000"  → 1500000
 * "\"2,500,000\"" → 2500000 (dấu ngoặc kép bị escape)
 */
function parseMoney(s?: string): number {
  if (!s) return 0;
  // Loại bỏ dấu ngoặc kép, dấu phẩy, dấu chấm phân tách hàng nghìn, ký tự không phải số/dấu thập phân
  const cleaned = s.replace(/['"]/g, '').replace(/[,\.]/g, '').replace(/[^\d]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Thuật toán phân tích cú pháp lãi suất (Interest Parsing Engine)
 * 
 * Hỗ trợ các định dạng:
 * - "100k /tuần"  → FIXED_PER_WEEK, 100000
 * - "15k/tuần"   → FIXED_PER_WEEK, 15000
 * - "8k /tuần"   → FIXED_PER_WEEK, 8000
 * - "6% /tháng"  → PERCENT_PER_MONTH, 6
 * - "7%/tháng"   → PERCENT_PER_MONTH, 7
 * - "3k/triệu/ngày" → PER_MILLION_PER_DAY, 3000
 * - "100k/tháng" → FIXED_PER_MONTH, 100000
 */
function parseInterestRate(s?: string): {
  interestRateType:  string;
  interestRateValue: number;
  interestCycle:     string;
} {
  const DEFAULT = { interestRateType: 'FIXED_PER_WEEK', interestRateValue: 0, interestCycle: 'WEEKLY' };
  if (!s) return DEFAULT;

  // Chuẩn hóa: bỏ spaces, lowercase
  const clean = s.trim().toLowerCase().replace(/\s+/g, '');

  // Pattern: Xk/tuần hoặc Xk/tuan
  const weeklyFixed = clean.match(/^(\d+(?:[.,]\d+)?)k[\/\\]tu[aâ]n$/);
  if (weeklyFixed) {
    const num = parseFloat(weeklyFixed[1].replace(',', '.'));
    return { interestRateType: 'FIXED_PER_WEEK', interestRateValue: Math.round(num * 1000), interestCycle: 'WEEKLY' };
  }

  // Pattern: X%/tháng hoặc X%/thang
  const monthlyPct = clean.match(/^(\d+(?:[.,]\d+)?)%[\/\\]th[aá]ng$/);
  if (monthlyPct) {
    return { interestRateType: 'PERCENT_PER_MONTH', interestRateValue: parseFloat(monthlyPct[1].replace(',', '.')), interestCycle: 'MONTHLY' };
  }

  // Pattern: Xk/triệu/ngày
  const perMillion = clean.match(/^(\d+(?:[.,]\d+)?)k[\/\\]tri[eệ]u[\/\\]ng[aà]y$/);
  if (perMillion) {
    const num = parseFloat(perMillion[1].replace(',', '.'));
    return { interestRateType: 'PER_MILLION_PER_DAY', interestRateValue: Math.round(num * 1000), interestCycle: 'DAILY' };
  }

  // Pattern: Xk/tháng (cố định theo tháng)
  const monthlyFixed = clean.match(/^(\d+(?:[.,]\d+)?)k[\/\\]th[aá]ng$/);
  if (monthlyFixed) {
    const num = parseFloat(monthlyFixed[1].replace(',', '.'));
    return { interestRateType: 'FIXED_PER_MONTH', interestRateValue: Math.round(num * 1000), interestCycle: 'MONTHLY' };
  }

  // Fallback: cố gắng trích xuất số
  const numMatch = clean.match(/(\d+(?:[.,]\d+)?)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    return { interestRateType: 'FIXED_PER_WEEK', interestRateValue: Math.round(val * 1000), interestCycle: 'WEEKLY' };
  }

  return DEFAULT;
}

/**
 * Chuẩn hóa dòng thời gian (Date Normalization)
 * Chuyển DD-MM-YYYY hoặc DD/MM/YYYY → Date object JavaScript hợp lệ
 */
function parseDate(s?: string): Date | null {
  if (!s || s.trim() === '' || s === '0' || s === '-') return null;

  const trimmed = s.trim();

  // DD-MM-YYYY hoặc DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) {
    const day   = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1; // 0-indexed
    const year  = parseInt(dmy[3], 10);
    const d = new Date(year, month, day);
    // Kiểm tra ngày hợp lệ
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  // YYYY-MM-DD (ISO format)
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Suy luận loại tài sản từ mô tả đồ cầm
 */
function inferAssetType(desc?: string): string {
  if (!desc) return 'KHAC';
  const d = desc.toLowerCase();

  // Xe máy - nhận diện theo thương hiệu và biển số
  if (
    d.includes('wave') || d.includes('airblade') || d.includes('vision') ||
    d.includes('pcx') || d.includes('sh ') || d.includes('sh-') ||
    d.includes('vario') || d.includes('lead') || d.includes('click') ||
    d.includes('spacy') || d.includes('hayate') || d.includes('exciter') ||
    d.includes('sirius') || d.includes('jupiter') || d.includes('xe máy') ||
    d.includes('yamaha') || d.includes('suzuki') || d.includes('honda') ||
    d.match(/\b\d{2}[a-z]\d\b/i) // biển số kiểu 59L1
  ) return 'XM';

  // Điện thoại
  if (
    d.includes('iphone') || d.includes('samsung') || d.includes('oppo') ||
    d.includes('xiaomi') || d.includes('realme') || d.includes('nokia') ||
    d.includes('vivo') || d.includes('redmi') || d.includes('galaxy') ||
    d.includes('điện thoại')
  ) return 'DT';

  // Laptop
  if (
    d.includes('laptop') || d.includes('dell') || d.includes('macbook') ||
    d.includes('acer') || d.includes('asus') || d.includes('lenovo') ||
    d.includes('hp ') || d.includes('surface')
  ) return 'LT';

  // Vàng
  if (d.includes('vàng') || d.includes('nhẫn') || d.includes('dây chuyền') || d.includes('lắc')) return 'VANG';

  // Ô tô
  if (
    d.includes('ô tô') || d.includes('xe hơi') || d.includes('toyota') ||
    d.includes('honda city') || d.includes('vios') || d.includes('fortuner')
  ) return 'OTO';

  return 'KHAC';
}

// ──────────────────────────────────────────────
// MAIN HANDLER
// ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Xác thực session
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as any).shopId as string;
  if (!shopId) return NextResponse.json({ error: 'Không tìm thấy cửa hàng trong session' }, { status: 400 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Vui lòng chọn file CSV' }, { status: 400 });

    // Đọc nội dung file
    const text = await file.text();

    // Parse CSV bằng papaparse
    const parsed = Papa.parse<MigrationRow>(text, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: (h: string) => h.trim(),
      transform:       (v: string) => v.trim(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'File CSV không hợp lệ: ' + parsed.errors[0]?.message }, { status: 400 });
    }

    const rows = parsed.data;
    const result: MigrationResult = {
      total:   rows.length,
      success: 0,
      skipped: 0,
      errors:  [],
    };

    // ── Xử lý từng dòng dữ liệu ──
    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2; // 1-indexed, +1 cho header

      try {
        // ── Kiểm tra dữ liệu bắt buộc ──
        const contractCode = row['Mã HĐ']?.trim();
        const customerName = row['Tên KH']?.trim();
        const phone        = row['SĐT']?.replace(/\D/g, '').trim() || undefined;

        if (!customerName) {
          result.skipped++;
          continue;
        }

        // ── Parse tài chính ──
        const pawningAmount = parseMoney(row['Tiền vay']);
        if (pawningAmount <= 0) {
          result.errors.push({
            row:    rowNum,
            code:   contractCode ?? `Dòng ${rowNum}`,
            reason: `Tiền vay không hợp lệ: "${row['Tiền vay']}"`,
          });
          result.skipped++;
          continue;
        }

        const { interestRateType, interestRateValue, interestCycle } = parseInterestRate(row['Lãi Phí']);

        // ── Parse ngày tháng (chuẩn hóa định dạng DD-MM-YYYY) ──
        const startDate   = parseDate(row['Ngày vay']) ?? new Date();
        const dueDate     = parseDate(row['Ngày hết hạn']);
        const nextDueDate = parseDate(row['Ngày đóng lãi tiếp theo']);

        // ── Parse các trường khác ──
        const totalInterestPaid = parseMoney(row['Tiền lãi đã đóng']);
        const cccd              = row['CMND']?.trim() || null;
        const address           = row['Địa chỉ']?.trim() || null;
        const assetDesc         = row['Đồ cầm']?.trim();
        const assetType         = inferAssetType(assetDesc);

        // Trích xuất biển số từ mô tả tài sản (VD: "WAVE 47AA-761.50" → "47AA-761.50")
        let assetPlate: string | null = null;
        let assetName:  string | null = assetDesc ?? null;
        const plateMatch = assetDesc?.match(/([A-Z0-9]{2,4}[-.][\d]{3}[-.]{0,1}[\d]{2})/i);
        if (plateMatch) {
          assetPlate = plateMatch[1].toUpperCase();
          assetName  = assetDesc?.replace(plateMatch[1], '').trim() || assetDesc || null;
        }

        // ── Xác định trạng thái hợp đồng ──
        let status = 'ACTIVE';
        if (nextDueDate && nextDueDate < new Date()) {
          const diffDays = Math.floor((Date.now() - nextDueDate.getTime()) / 86_400_000);
          if (diffDays > 10) {
            status = 'PENDING_LIQUIDATION';
          } else {
            status = 'INTEREST_DUE';
          }
        }

        // ── Thực thi trong transaction để đảm bảo tính toàn vẹn ──
        let wasSkipped = false;
        await prisma.$transaction(async (tx) => {
          // Bước A: Tìm hoặc tạo khách hàng
          let customer = null;

          // Tìm theo SĐT trước
          if (phone) {
            customer = await tx.customer.findFirst({ where: { shopId, phone } });
          }
          // Nếu không tìm thấy, tìm theo CCCD
          if (!customer && cccd) {
            customer = await tx.customer.findFirst({ where: { shopId, cccdNumber: cccd } });
          }
          // Nếu vẫn không có → tạo mới
          if (!customer) {
            customer = await tx.customer.create({
              data: {
                shopId,
                fullName:   customerName,
                phone:      phone || null,
                cccdNumber: cccd,
                address:    address,
                status:     'NORMAL',
              },
            });
          } else {
            // Cập nhật thông tin còn thiếu nếu có
            const updates: Record<string, string | null> = {};
            if (!customer.phone && phone)        updates.phone      = phone;
            if (!customer.cccdNumber && cccd)    updates.cccdNumber = cccd;
            if (!customer.address && address)    updates.address    = address;
            if (Object.keys(updates).length > 0) {
              await tx.customer.update({ where: { id: customer.id }, data: updates });
            }
          }

          // Bước B: Kiểm tra trùng lặp Mã HĐ
          if (contractCode) {
            const existing = await tx.contract.findFirst({ where: { shopId, contractCode } });
            if (existing) {
              wasSkipped = true;
              return; // Skip - đã tồn tại
            }
          }

          // Bước C: Tạo hợp đồng mới
          await tx.contract.create({
            data: {
              shopId,
              contractCode:     contractCode ?? `IMP-${Date.now()}-${i}`,
              customerId:       customer.id,
              assetType,
              assetName,
              assetModel:       assetName,
              assetPlate,
              assetNote:        assetDesc,
              assetImages:      '[]',
              pawningAmount,
              interestRateType,
              interestRateValue,
              interestCycle,
              startDate,
              dueDate:          dueDate      ?? undefined,
              interestDueDate:  nextDueDate  ?? undefined,
              status,
              totalInterestPaid,
              importedFrom:     '1GOLD',
            },
          });
        });

        if (wasSkipped) {
          result.skipped++;
        } else {
          result.success++;
        }

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Lỗi không xác định';
        result.errors.push({
          row:    rowNum,
          code:   row['Mã HĐ'] ?? `Dòng ${rowNum}`,
          reason: message,
        });
        // KHÔNG throw - tiếp tục xử lý dòng tiếp theo (Fault Tolerance)
      }
    }

    return NextResponse.json({ ok: true, result });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Migration 1Gold] Fatal error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
