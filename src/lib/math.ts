// ============================================================
// LendOS - Interest Calculation Engine
// Thuật toán tính lãi cốt lõi - CRITICAL BUSINESS LOGIC
// ============================================================
import type { RateType, InterestCycle, InterestCalculation } from '@/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Tính số ngày giữa 2 mốc thời gian
 */
export function calcDaysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toMidnight.getTime() - fromMidnight.getTime()) / MS_PER_DAY);
}

/**
 * Tính số chu kỳ lãi đã qua
 */
export function calcCycles(days: number, cycle: InterestCycle): number {
  const cycleDays = getCycleDays(cycle);
  return Math.floor(days / cycleDays);
}

/**
 * Số ngày trong một chu kỳ
 */
export function getCycleDays(cycle: InterestCycle): number {
  switch (cycle) {
    case 'DAILY':    return 1;
    case 'WEEKLY':   return 7;
    case 'BIWEEKLY': return 14;
    case 'MONTHLY':  return 30;
    default:         return 30;
  }
}

/**
 * Tính lãi phí tích lũy đến hôm nay
 * 
 * Quy tắc nghiệp vụ:
 * - PER_MILLION_PER_DAY: rateValue (VD: 3000) = 3k/triệu/ngày
 *   => lãi = (pawningAmount / 1_000_000) * rateValue * totalDays
 * - PERCENT_PER_MONTH: rateValue (VD: 6) = 6%/tháng
 *   => lãi = pawningAmount * (rateValue / 100) * (days / 30)
 * - FIXED_PER_WEEK: rateValue (VD: 50000) = 50k/tuần cố định
 *   => lãi = rateValue * cycles
 * - FIXED_PER_MONTH: rateValue (VD: 200000) = 200k/tháng cố định
 *   => lãi = rateValue * cycles
 */
export function calcAccruedInterest(
  pawningAmount: number,
  rateType: RateType,
  rateValue: number,
  cycle: InterestCycle,
  startDate: Date,
  toDate: Date = new Date()
): number {
  const totalDays = Math.max(0, calcDaysBetween(startDate, toDate));
  
  switch (rateType) {
    case 'PER_MILLION_PER_DAY': {
      // rateValue = số tiền lãi trên 1 triệu mỗi ngày
      const perMillionPerDay = rateValue;
      const millions = pawningAmount / 1_000_000;
      return Math.round(millions * perMillionPerDay * totalDays);
    }
    
    case 'PERCENT_PER_MONTH': {
      // rateValue = % mỗi tháng (30 ngày)
      const dailyRate = (rateValue / 100) / 30;
      return Math.round(pawningAmount * dailyRate * totalDays);
    }
    
    case 'FIXED_PER_WEEK': {
      // rateValue = số tiền cố định mỗi tuần
      const cycles = Math.ceil(totalDays / 7);
      return Math.round(rateValue * cycles);
    }
    
    case 'FIXED_PER_MONTH': {
      // rateValue = số tiền cố định mỗi tháng
      const cycles = Math.ceil(totalDays / 30);
      return Math.round(rateValue * cycles);
    }
    
    default:
      return 0;
  }
}

/**
 * Tính ngày phải đóng lãi tiếp theo
 */
export function calcNextDueDate(
  startDate: Date,
  cycle: InterestCycle,
  lastPaymentDate?: Date | null
): Date {
  const baseDate = lastPaymentDate || startDate;
  const cycleDays = getCycleDays(cycle);
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + cycleDays);
  return nextDate;
}

/**
 * Tính đầy đủ thông tin lãi suất cho hiển thị
 */
export function calculateInterest(
  pawningAmount: number,
  rateType: RateType,
  rateValue: number,
  cycle: InterestCycle,
  startDate: Date,
  toDate: Date = new Date()
): InterestCalculation {
  const totalDays = Math.max(0, calcDaysBetween(startDate, toDate));
  const cycleDays = getCycleDays(cycle);
  const totalCycles = Math.floor(totalDays / cycleDays);
  const accruedInterest = calcAccruedInterest(pawningAmount, rateType, rateValue, cycle, startDate, toDate);
  const nextDueDate = calcNextDueDate(startDate, cycle);
  
  return {
    principal: pawningAmount,
    rateType,
    rateValue,
    cycle,
    startDate,
    toDate,
    totalDays,
    totalCycles,
    accruedInterest,
    nextDueDate,
  };
}

/**
 * Tính lãi cho một kỳ đóng
 */
export function calcInterestForCycle(
  pawningAmount: number,
  rateType: RateType,
  rateValue: number,
  cycle: InterestCycle
): number {
  const cycleDays = getCycleDays(cycle);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + cycleDays);
  
  return calcAccruedInterest(pawningAmount, rateType, rateValue, cycle, startDate, endDate);
}

/**
 * Kiểm tra hợp đồng có trễ hạn không
 */
export function isContractOverdue(interestDueDate: Date | null | undefined): boolean {
  if (!interestDueDate) return false;
  return new Date() > new Date(interestDueDate);
}

/**
 * Số ngày trễ hạn
 */
export function overdueDays(interestDueDate: Date | null | undefined): number {
  if (!interestDueDate) return 0;
  const days = calcDaysBetween(new Date(interestDueDate), new Date());
  return Math.max(0, days);
}

/**
 * Xác định trạng thái hợp đồng dựa trên nghiệp vụ
 */
export function determineContractStatus(
  interestDueDate: Date | null | undefined,
  liquidationAfterDays: number = 10
): 'ACTIVE' | 'INTEREST_DUE' | 'PENDING_LIQUIDATION' {
  if (!interestDueDate) return 'ACTIVE';
  
  const overdue = overdueDays(interestDueDate);
  if (overdue <= 0) return 'ACTIVE';
  if (overdue < liquidationAfterDays) return 'INTEREST_DUE';
  return 'PENDING_LIQUIDATION';
}

/**
 * Tính tiền phải thu khi chuộc đồ
 */
export function calcRedemptionAmount(
  pawningAmount: number,
  rateType: RateType,
  rateValue: number,
  cycle: InterestCycle,
  startDate: Date,
  totalPaid: number = 0
): number {
  const totalInterest = calcAccruedInterest(pawningAmount, rateType, rateValue, cycle, startDate);
  const remaining = Math.max(0, totalInterest - totalPaid);
  return pawningAmount + remaining;
}

/**
 * Format lãi suất hiển thị ngắn gọn
 */
export function formatRateShort(rateType: RateType, rateValue: number, cycle: InterestCycle): string {
  switch (rateType) {
    case 'PER_MILLION_PER_DAY': {
      const k = rateValue / 1000;
      const cycleLabel = cycle === 'WEEKLY' ? 'tuần' : cycle === 'MONTHLY' ? 'tháng' : 'ngày';
      return `${k}k/triệu/${cycleLabel}`;
    }
    case 'PERCENT_PER_MONTH':
      return `${rateValue}%/tháng`;
    case 'FIXED_PER_WEEK': {
      const k = rateValue / 1000;
      return `${k}k/tuần`;
    }
    case 'FIXED_PER_MONTH': {
      const k = rateValue / 1000;
      return `${k}k/tháng`;
    }
    default:
      return `${rateValue}`;
  }
}
