import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ContractStatus, RateType, InterestCycle } from '@/types';

// ============================================================
// Tailwind utility
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Number Formatting (Vietnamese)
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function parseCurrency(str: string): number {
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
}

// ============================================================
// Date Formatting
// ============================================================
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '--';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: vi });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '--';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm dd/MM/yyyy', { locale: vi });
}

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ============================================================
// Contract Status Labels & Colors
// ============================================================
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'Đang cầm',
  INTEREST_DUE: 'Chậm lãi phí',
  PENDING_LIQUIDATION: 'Chờ thanh lý',
  LIQUIDATED: 'Đã thanh lý',
  REDEEMED: 'Đã chuộc',
  OLD_DEBT: 'Nợ cũ',
  BAD_DEBT: 'Nợ xấu',
  CLOSED: 'Đã đóng',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  ACTIVE: 'bg-emerald-500 text-white',
  INTEREST_DUE: 'bg-amber-500 text-white',
  PENDING_LIQUIDATION: 'bg-orange-500 text-white',
  LIQUIDATED: 'bg-gray-500 text-white',
  REDEEMED: 'bg-blue-500 text-white',
  OLD_DEBT: 'bg-red-400 text-white',
  BAD_DEBT: 'bg-red-700 text-white',
  CLOSED: 'bg-slate-200 text-slate-800',
};

export const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  ACTIVE: 'status-active',
  INTEREST_DUE: 'status-due',
  PENDING_LIQUIDATION: 'status-pending',
  LIQUIDATED: 'status-liquidated',
  REDEEMED: 'status-redeemed',
  OLD_DEBT: 'status-old-debt',
  BAD_DEBT: 'status-bad-debt',
  CLOSED: 'status-liquidated',
};

// ============================================================
// Asset Type Labels
// ============================================================
export const ASSET_TYPE_LABELS: Record<string, string> = {
  XM: 'Xe máy',
  OTO: 'Ô tô',
  DT: 'Điện thoại',
  LT: 'Laptop',
  VANG: 'Vàng',
  KHAC: 'Khác',
};

// ============================================================
// Interest Rate Labels
// ============================================================
export const RATE_TYPE_LABELS: Record<RateType, string> = {
  PERCENT_PER_MONTH: '%/tháng',
  PER_MILLION_PER_DAY: 'k/triệu/ngày',
  FIXED_PER_WEEK: 'cố định/tuần',
  FIXED_PER_MONTH: 'cố định/tháng',
};

export const CYCLE_LABELS: Record<InterestCycle, string> = {
  DAILY: 'Ngày',
  WEEKLY: 'Tuần',
  BIWEEKLY: '2 tuần',
  MONTHLY: 'Tháng',
};

export function formatInterestRate(rateType: RateType, rateValue: number, cycle: InterestCycle): string {
  const cycleLabel = CYCLE_LABELS[cycle];
  switch (rateType) {
    case 'PERCENT_PER_MONTH':
      return `${rateValue}%/tháng`;
    case 'PER_MILLION_PER_DAY':
      return `${formatNumber(rateValue)}đ/triệu/${cycleLabel.toLowerCase()}`;
    case 'FIXED_PER_WEEK':
      return `${formatNumber(rateValue)}đ/tuần`;
    case 'FIXED_PER_MONTH':
      return `${formatNumber(rateValue)}đ/tháng`;
    default:
      return `${rateValue}`;
  }
}

// ============================================================
// Contract code generator
// ============================================================
export function generateContractCode(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
}

// ============================================================
// Phone formatter
// ============================================================
export function formatPhone(phone: string): string {
  if (!phone) return '--';
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
}

// ============================================================
// Days calculator
// ============================================================
export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

// ============================================================
// Parse CCCD QR string (Vietnam format)
// Format: id|oldId|name|dob|sex|address|issueDate
// ============================================================
export function parseCCCDQR(qrString: string) {
  const parts = qrString.split('|');
  if (parts.length >= 7) {
    return {
      id: parts[0],
      name: parts[2],
      dob: parts[3],
      gender: parts[4] === 'Nam' ? 'Nam' : 'Nữ',
      address: parts[5],
    };
  }
  return null;
}

// ============================================================
// Vietnamese number to words (for bills)
// ============================================================
export function numberToViWords(num: number): string {
  if (num === 0) return 'Không đồng';
  
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  
  function convertHundred(n: number): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    let result = '';
    if (h > 0) result += ones[h] + ' trăm ';
    if (t > 0) result += tens[t] + ' ';
    else if (h > 0 && o > 0) result += 'lẻ ';
    if (o > 0) result += ones[o] + ' ';
    return result.trim();
  }

  const billion = Math.floor(num / 1_000_000_000);
  const million = Math.floor((num % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((num % 1_000_000) / 1_000);
  const rest = num % 1_000;
  
  let result = '';
  if (billion > 0) result += convertHundred(billion) + ' tỷ ';
  if (million > 0) result += convertHundred(million) + ' triệu ';
  if (thousand > 0) result += convertHundred(thousand) + ' nghìn ';
  if (rest > 0) result += convertHundred(rest);
  
  return result.trim().replace(/\s+/g, ' ') + ' đồng';
}

// ============================================================
// Truncate text
// ============================================================
export function truncate(str: string, maxLen: number = 30): string {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}
