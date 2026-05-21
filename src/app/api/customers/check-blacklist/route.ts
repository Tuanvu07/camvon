import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shopId = (session.user as any).shopId;
    const { searchParams } = new URL(req.url);
    const cccd = searchParams.get('cccd');
    const phone = searchParams.get('phone');

    if (!cccd && !phone) {
      return NextResponse.json({ error: 'Missing cccd or phone parameter' }, { status: 400 });
    }

    // Tìm kiếm khách hàng theo CCCD hoặc Phone
    const customer = await prisma.customer.findFirst({
      where: {
        shopId,
        OR: [
          ...(cccd ? [{ cccdNumber: cccd }] : []),
          ...(phone ? [{ phone: phone }] : [])
        ]
      },
      select: {
        id: true,
        fullName: true,
        badDebtCount: true,
        status: true
      }
    });

    if (!customer) {
      return NextResponse.json({ isBlacklisted: false, badDebtCount: 0 });
    }

    return NextResponse.json({
      isBlacklisted: customer.badDebtCount > 0 || customer.status === 'BLACKLIST',
      badDebtCount: customer.badDebtCount,
      fullName: customer.fullName
    });
  } catch (error: any) {
    console.error('BLACKLIST_CHECK_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
