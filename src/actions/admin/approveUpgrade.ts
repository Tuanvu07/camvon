'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function approveUpgrade(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error('Unauthorized');
    
    // Bảo mật: Xác thực Super Admin ở tầng Server Action
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'tr.tuan0707@gmail.com';
    if (session.user.email !== superAdminEmail) {
      throw new Error('Forbidden: Super Admin only');
    }

    const shopId = formData.get('shopId') as string;
    if (!shopId) throw new Error('Missing Shop ID');

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');

    // Nâng cấp: Cộng 30 ngày (1 tháng) vào ngày hết hạn
    const baseDate = (shop.trialEndsAt && shop.trialEndsAt > new Date()) ? shop.trialEndsAt : new Date();
    const newExpiryDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        plan: 'PREMIUM',
        trialEndsAt: newExpiryDate,
        upgradeRequested: false
      }
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
