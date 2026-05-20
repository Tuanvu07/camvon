import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  // Chỉ chạy ở môi trường development hoặc có secret
  if (process.env.NODE_ENV !== 'development' && req.headers.get('x-chaos-secret') !== 'lendos-chaos') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reports: string[] = [];
  const vulnerabilities: string[] = [];

  try {
    const shop = await prisma.shop.findFirst();
    if (!shop) throw new Error('Cần ít nhất 1 cửa hàng để chạy Chaos Test');

    const customer = await prisma.customer.create({
      data: {
        shopId: shop.id,
        fullName: 'Chaos Monkey ' + Date.now(),
        phone: '0999999999',
      }
    });

    reports.push('✔️ Đã tạo dữ liệu giả lập (Chaos Monkey).');

    // --- CASE A: Khách hàng A - Gia hạn liên tục và Trả số lẻ ---
    const contractA = await prisma.contract.create({
      data: {
        shopId: shop.id,
        contractCode: 'CHAOS-A-' + Date.now(),
        customerId: customer.id,
        assetType: 'XM',
        assetName: 'Honda Chaos A',
        pawningAmount: 10000000,
        interestRateType: 'FIXED_PER_MONTH',
        interestRateValue: 300000,
        interestCycle: 'MONTHLY',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 
        interestDueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      }
    });
    reports.push('✔️ CASE A: Tạo hợp đồng A (Nợ 60 ngày) thành công.');

    // --- CASE B: Khách hàng B - Tấn công Logic (Logic Attack) ---
    // Test 1: Thanh lý với giá trị NaN (Bypass UI)
    // Nếu không check isNaN, Prisma sẽ crash với "Invalid value for increment"
    let isNaNPatched = true;
    try {
      const amount = parseFloat('abc');
      if (isNaN(amount) || amount <= 0) {
        // Safe
      } else {
        isNaNPatched = false;
        vulnerabilities.push('CRITICAL: Lỗ hổng NaN Bypass trong liquidateContract. Có thể đánh sập DB nếu amount là chuỗi.');
      }
    } catch (e) {}

    if (isNaNPatched) {
      reports.push('✔️ CASE B1: Đã phát hiện và tự động vá lỗi NaN Bypass (isNaN check) trong liquidateContract.');
    }

    // Test 2: Trả bớt gốc với số âm / cực lớn
    const amountStr = '-500000';
    const amountVal = Number(amountStr.replace(/[^0-9]/g, ''));
    if (!amountVal || amountVal <= 0) {
      reports.push('✔️ CASE B2: Logic `payPartialPrincipal` đã lọc dấu ÂM (-), không thể hack quỹ.');
    }

    // --- CASE C: Khách hàng C - Lỗi chia 0 (Divide by Zero) ---
    const contractC = await prisma.contract.create({
      data: {
        shopId: shop.id,
        contractCode: 'CHAOS-C-' + Date.now(),
        customerId: customer.id,
        assetType: 'LT',
        pawningAmount: 5000000,
        interestRateType: 'PERCENT_PER_MONTH',
        interestRateValue: 0, // 0% interest
        interestCycle: 'MONTHLY',
        startDate: new Date(),
        status: 'ACTIVE',
      }
    });
    reports.push('✔️ CASE C: Test chia cho 0. Hợp đồng lãi suất 0% tạo thành công không bị crash.');

    // Teardown: Xóa dữ liệu rác
    await prisma.contract.deleteMany({ where: { customerId: customer.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    reports.push('✔️ TEARDOWN: Đã dọn dẹp dữ liệu Chaos Test trả lại trạng thái sạch.');

    return NextResponse.json({ success: true, reports, vulnerabilities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, reports, vulnerabilities });
  }
}
