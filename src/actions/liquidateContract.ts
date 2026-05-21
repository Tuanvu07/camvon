'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function liquidateContract(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error('Phiên đăng nhập hết hạn.');
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const staffName = (session.user as any).name || 'Hệ thống';
    
    if (!shopId) throw new Error('Không xác định được cửa hàng.');

    const contractId = formData.get('contractId') as string;
    const amountStr = formData.get('amount') as string;
    
    // Parse số tiền an toàn
    const amount = Number(amountStr.replace(/[^0-9]/g, ''));
    if (!contractId || isNaN(amount) || amount <= 0) throw new Error('Giá bán thanh lý không hợp lệ');

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, shopId }
    });
    if (!contract) throw new Error('Hợp đồng không tồn tại');

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Hợp đồng
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'LIQUIDATED' }
      });

      // 2. Tăng điểm nợ xấu (badDebtCount) của Khách hàng lên 1 (CREDIT SCORING ENGINE)
      await tx.customer.update({
        where: { id: contract.customerId },
        data: {
          badDebtCount: { increment: 1 },
          status: 'BLACKLIST' // Đưa thẳng vào Blacklist
        }
      });

      // 3. Ghi nhận dòng tiền
      await tx.transaction.create({
        data: {
          shopId,
          contractId,
          userId,
          type: 'LIQUIDATION',
          amount,
          description: `Bán thanh lý tài sản. Lỗ/Lãi so với gốc: ${amount - contract.pawningAmount}đ`,
          staffName
        }
      });

      // 4. Cập nhật Sổ quỹ
      await tx.shop.update({
        where: { id: shopId },
        data: { cashBalance: { increment: amount } }
      });

      // 5. Ghi Log Audit
      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          contractId,
          action: 'LIQUIDATE_CONTRACT',
          entity: 'Contract',
          entityId: contractId,
          oldData: JSON.stringify({ status: contract.status }),
          newData: JSON.stringify({ status: 'LIQUIDATED', soldAmount: amount, lossOrProfit: amount - contract.pawningAmount })
        }
      });
    });
    
    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard/liquidations');
    revalidatePath('/dashboard/cashbook');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    console.error('LIQUIDATE_ERROR:', error);
    return { success: false, error: error.message, stack: error.stack };
  }
}
