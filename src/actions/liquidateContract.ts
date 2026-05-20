'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function liquidateContract(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const staffName = (session.user as any).name;
    
    const contractId = formData.get('contractId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    if (!contractId || isNaN(amount) || amount <= 0) throw new Error('Giá bán không hợp lệ');

    await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId, shopId },
        data: { status: 'LIQUIDATED' }
      });
      await tx.transaction.create({
        data: {
          shopId,
          contractId,
          userId,
          type: 'LIQUIDATION',
          amount,
          description: 'Bán thanh lý tài sản',
          staffName
        }
      });
      await tx.shop.update({
        where: { id: shopId },
        data: { cashBalance: { increment: amount } }
      });
    });
    
    revalidatePath('/dashboard/liquidations');
    revalidatePath('/dashboard/cashbook');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
