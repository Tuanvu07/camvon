'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function adjustCapital(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'OWNER') {
      throw new Error('Chỉ Chủ cửa hàng mới có quyền thay đổi nguồn vốn.');
    }
    
    const shopId = (session.user as any).shopId;
    const userId = (session.user as any).id;
    const staffName = (session.user as any).name;
    
    // Trial Bouncer Check
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (shop && shop.plan === 'FREE' && shop.trialEndsAt && new Date() > shop.trialEndsAt) {
      throw new Error('Vui lòng nâng cấp gói cước để tiếp tục.');
    }
    
    const amount = parseFloat(formData.get('amount') as string);
    const actionType = formData.get('actionType') as string;
    const description = formData.get('description') as string || (actionType === 'ADD' ? 'Bơm thêm vốn' : 'Rút bớt vốn');
    
    if (isNaN(amount) || amount <= 0) throw new Error('Số tiền không hợp lệ');

    await prisma.$transaction(async (tx) => {
      const incrementValue = actionType === 'ADD' ? amount : -amount;
      await tx.shop.update({
        where: { id: shopId },
        data: { cashBalance: { increment: incrementValue } }
      });
      await tx.transaction.create({
        data: {
          shopId,
          userId,
          type: actionType === 'ADD' ? 'FUND_TRANSFER' : 'EXPENSE',
          amount,
          description,
          staffName
        }
      });
    });
    
    revalidatePath('/dashboard/capital');
    revalidatePath('/dashboard/cashbook');
    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
