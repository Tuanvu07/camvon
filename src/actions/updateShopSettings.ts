'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const shopId = (session.user as any).shopId;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    
    await prisma.shop.update({
      where: { id: shopId },
      data: { name, phone, address }
    });
    
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
