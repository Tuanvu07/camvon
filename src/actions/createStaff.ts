'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

export async function createStaff(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
    
    const role = (session.user as any).role;
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new Error('Chỉ Quản lý hoặc Chủ cửa hàng mới được quyền thêm nhân viên!');
    }
    
    const shopId = (session.user as any).shopId;
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = `${username}@lendos.vn`;
    
    const existingUser = await prisma.user.findFirst({ where: { username } });
    if (existingUser) throw new Error('Tên đăng nhập này đã tồn tại trong hệ thống!');

    const passwordHash = await bcrypt.hash('123456', 10);
    
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          name,
          passwordHash
        }
      });
      
      await tx.shopUser.create({
        data: {
          shopId,
          userId: user.id,
          role: 'STAFF'
        }
      });
    });
    
    revalidatePath('/dashboard/staff');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
