import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const shopId = (session.user as any).shopId;
    const role = (session.user as any).role;

    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/reports?error=Unauthorized', request.url));
    }

    const txs = await prisma.transaction.findMany({
      where: { shopId },
      include: {
        contract: { select: { contractCode: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['Ngày Giao Dịch', 'Loại Giao Dịch', 'Mã Hợp Đồng', 'Số Tiền (VNĐ)', 'Người Thực Hiện', 'Nội Dung'];
    
    const rows = txs.map(tx => [
      `"${tx.createdAt.toISOString()}"`,
      `"${tx.type}"`,
      `"${tx.contract?.contractCode || ''}"`,
      `"${tx.amount}"`,
      `"${tx.staffName || tx.user?.name || ''}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Thêm ký tự BOM (Byte Order Mark) để Excel đọc đúng tiếng Việt (UTF-8)
    const bom = '\uFEFF';
    
    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="LendOS_SoQuy_Export.csv"'
      }
    });
  } catch (error) {
    console.error('Lỗi khi xuất CSV:', error);
    return NextResponse.redirect(new URL('/dashboard/reports?error=ExportFailed', request.url));
  }
}
