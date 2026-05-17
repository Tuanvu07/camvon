'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function getCycleDays(cycle: string): number {
  switch (cycle) {
    case 'DAILY': return 1;
    case 'WEEKLY': return 7;
    case 'BIWEEKLY': return 14;
    case 'MONTHLY': return 30;
    default: return 30;
  }
}

export async function processCollection(params: {
  contractId: string;
  amount: number;
  type: 'INTEREST_COLLECT' | 'REDEEM_OUT';
  cyclesToPay?: number;
  note?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized' };
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const staffName = (session.user as any).name;

    const { contractId, amount, type, cyclesToPay, note } = params;

    if (amount < 0) return { error: 'Số tiền không hợp lệ' };

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, shopId }
    });

    if (!contract) return { error: 'Hợp đồng không tồn tại' };

    await prisma.$transaction(async (tx) => {
      // 1. Record transaction in Cashbook
      await tx.transaction.create({
        data: {
          shopId,
          contractId,
          userId,
          type,
          amount,
          description: type === 'INTEREST_COLLECT' ? `Thu lãi phí ${cyclesToPay} kỳ` : 'Tất toán hợp đồng (chuộc đồ)',
          note,
          staffName,
          paymentMethod: 'CASH',
        }
      });

      // 2. Update Shop cash balance
      await tx.shop.update({
        where: { id: shopId },
        data: { cashBalance: { increment: amount } }
      });

      // 3. Update Contract status and dates
      if (type === 'INTEREST_COLLECT') {
        const cycleDays = getCycleDays(contract.interestCycle);
        let nextDate = contract.interestDueDate ? new Date(contract.interestDueDate) : new Date(contract.startDate);
        nextDate.setDate(nextDate.getDate() + (cycleDays * (cyclesToPay || 1)));

        // Determine if still overdue after payment
        let newStatus = contract.status;
        if (nextDate > new Date()) {
          newStatus = 'ACTIVE';
        } else {
          const diffDays = Math.floor((new Date().getTime() - nextDate.getTime()) / 86400000);
          newStatus = diffDays > 10 ? 'PENDING_LIQUIDATION' : 'INTEREST_DUE';
        }

        await tx.contract.update({
          where: { id: contractId },
          data: {
            totalInterestPaid: { increment: amount },
            lastPaymentDate: new Date(),
            interestDueDate: nextDate,
            status: newStatus
          }
        });
      } else if (type === 'REDEEM_OUT') {
        await tx.contract.update({
          where: { id: contractId },
          data: {
            // Amount minus pawningAmount is the extra interest collected upon closing
            totalInterestPaid: { increment: Math.max(0, amount - contract.pawningAmount) },
            lastPaymentDate: new Date(),
            status: 'REDEEMED',
            dueDate: new Date() // Mark as closed today
          }
        });
      }
    });

    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('processCollection error:', error);
    return { error: error.message || 'Lỗi hệ thống trong quá trình thu tiền' };
  }
}
