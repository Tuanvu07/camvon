'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function requestUpgrade() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error('Chưa đăng nhập');
    }

    const shopId = (session.user as any).shopId;

    await prisma.shop.update({
      where: { id: shopId },
      data: { upgradeRequested: true }
    });

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
