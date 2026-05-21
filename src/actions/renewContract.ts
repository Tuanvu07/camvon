'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function renewContract(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const userName = (session.user as any).name || 'Nhân viên';
    
    const contractId = formData.get('contractId') as string;
    if (!contractId) throw new Error('Không tìm thấy ID Hợp đồng');

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, shopId }
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại');

    // 1. Tính số ngày gia hạn dựa trên chu kỳ
    let daysToAdd = 30;
    if (contract.interestCycle === 'DAILY') daysToAdd = 1;
    else if (contract.interestCycle === 'WEEKLY') daysToAdd = 7;
    else if (contract.interestCycle === 'BIWEEKLY') daysToAdd = 14;

    // 2. Tính số tiền lãi 1 chu kỳ
    let interestAmount = 0;
    if (contract.interestRateType === 'PER_MILLION_PER_DAY') {
        interestAmount = (contract.pawningAmount / 1000000) * contract.interestRateValue * daysToAdd;
    } else if (contract.interestRateType === 'FIXED_PER_WEEK') {
        interestAmount = contract.interestRateValue * (daysToAdd / 7);
    } else if (contract.interestRateType === 'FIXED_PER_MONTH') {
        interestAmount = contract.interestRateValue * (daysToAdd / 30);
    } else if (contract.interestRateType === 'PERCENT_PER_MONTH') {
        interestAmount = (contract.pawningAmount * (contract.interestRateValue / 100)) * (daysToAdd / 30);
    }

    interestAmount = Math.round(interestAmount);

    // 3. Tịnh tiến ngày
    const currentDueDate = contract.interestDueDate ? new Date(contract.interestDueDate) : new Date(contract.startDate);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setUTCDate(newDueDate.getUTCDate() + daysToAdd);

    await prisma.$transaction(async (tx) => {
      // Cập nhật Hợp đồng
      await tx.contract.update({
        where: { id: contractId },
        data: {
          interestDueDate: newDueDate,
          status: 'ACTIVE',
          totalInterestPaid: {
            increment: interestAmount
          }
        }
      });

      // Ghi nhận dòng tiền (Thu Lãi)
      await tx.transaction.create({
        data: {
          shopId,
          userId,
          staffName: userName,
          contractId: contract.id,
          type: 'INTEREST_COLLECT', // Code của THU_LAI
          amount: interestAmount,
          description: `Thu lãi và gia hạn hợp đồng (+${daysToAdd} ngày)`
        }
      });

      // Cập nhật Sổ quỹ
      await tx.shop.update({
        where: { id: shopId },
        data: {
          cashBalance: {
            increment: interestAmount
          }
        }
      });

      // Ghi Audit Log (Immutable)
      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          contractId: contract.id,
          action: 'RENEW_CONTRACT',
          entity: 'Contract',
          entityId: contract.id,
          oldData: JSON.stringify({ interestDueDate: contract.interestDueDate, totalInterestPaid: contract.totalInterestPaid }),
          newData: JSON.stringify({ interestDueDate: newDueDate, totalInterestPaid: contract.totalInterestPaid + interestAmount, collectedInterest: interestAmount })
        }
      });
    });

    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard/cashbook');
    revalidatePath('/dashboard/reports');

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
