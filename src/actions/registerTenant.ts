'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function registerTenant(formData: FormData) {
  try {
    const shopName = formData.get('shopName') as string;
    const ownerName = formData.get('ownerName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!shopName || !ownerName || !email || !password) {
      throw new Error('Vui lòng điền đầy đủ thông tin');
    }

    // 1. Kiểm tra Email (Tránh trùng lặp)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
    }

    // 2. Băm mật khẩu để bảo mật tuyệt đối
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 3. Tính toán 14 ngày dùng thử (Free Trial)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 4. Kiến trúc Đa Người Thuê (Multi-Tenant) qua Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // Khởi tạo Tenant mới
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          ownerName: ownerName,
          cashBalance: 0,
          initialCapital: 0,
          trialEndsAt: trialEndsAt
        }
      });

      // Khởi tạo User (Chủ Tenant)
      const user = await tx.user.create({
        data: {
          email,
          username: email, // Dùng email làm định danh đăng nhập
          name: ownerName,
          passwordHash,
        }
      });

      // Mapping User vào Tenant với quyền cao nhất (OWNER)
      await tx.shopUser.create({
        data: {
          shopId: shop.id,
          userId: user.id,
          role: 'OWNER',
          isActive: true
        }
      });
    });

    return { success: true, redirect: '/login' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống không xác định', stack: error.stack };
  }
}
