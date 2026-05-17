import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // Create Shop
    const shop = await prisma.shop.upsert({
      where: { id: 'default-shop-1' },
      update: {},
      create: {
        id: 'default-shop-1',
        name: 'Cầm Đồ Phát Lộc',
        initialCapital: 500000000,
        cashBalance: 500000000,
      }
    });

    // Create Admin User
    const user = await prisma.user.upsert({
      where: { email: 'admin@hoaphat.vn' },
      update: {
        passwordHash
      },
      create: {
        email: 'admin@hoaphat.vn',
        username: 'admin',
        name: 'Quản trị viên',
        passwordHash
      }
    });

    // Link user to shop
    await prisma.shopUser.upsert({
      where: {
        shopId_userId: {
          shopId: shop.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        shopId: shop.id,
        userId: user.id,
        role: 'OWNER'
      }
    });

    return NextResponse.json({ success: true, message: 'Seeded default admin and shop' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
