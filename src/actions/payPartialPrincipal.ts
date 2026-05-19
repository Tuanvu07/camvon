'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { formatCurrency } from '@/lib/utils';

export async function payPartialPrincipal(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const userName = (session.user as any).name || 'Nhân viên';
    
    const contractId = formData.get('contractId') as string;
    const amountStr = formData.get('amount') as string;
    if (!contractId) throw new Error('Không tìm thấy ID Hợp đồng');
    
    const amount = Number(amountStr.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) throw new Error('Số tiền trả bớt không hợp lệ');

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, shopId }
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại');

    if (amount >= contract.pawningAmount) {
      throw new Error('Số tiền trả bớt gốc phải nhỏ hơn dư nợ gốc hiện tại. Nếu trả hết, vui lòng chọn chức năng Tất toán.');
    }

    const remainingAmount = contract.pawningAmount - amount;

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Hợp đồng
      await tx.contract.update({
        where: { id: contractId },
        data: {
          pawningAmount: {
            decrement: amount
          }
        }
      });

      // 2. Ghi nhận Transaction
      await tx.transaction.create({
        data: {
          shopId,
          userId,
          staffName: userName,
          contractId: contract.id,
          type: 'REPAY_PRINCIPAL',
          amount: amount,
          description: `Trả bớt nợ gốc. Dư nợ còn lại: ${formatCurrency(remainingAmount)}`
        }
      });

      // 3. Cập nhật Sổ quỹ
      await tx.shop.update({
        where: { id: shopId },
        data: {
          cashBalance: {
            increment: amount
          }
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
