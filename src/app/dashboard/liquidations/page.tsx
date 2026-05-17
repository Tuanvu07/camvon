import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import LiquidationsClient from './LiquidationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LiquidationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  
  try {
    const contracts = await prisma.contract.findMany({
      where: { shopId, status: { in: ['PENDING_LIQUIDATION', 'LIQUIDATED'] } },
      include: { customer: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    const pending = contracts.filter(c => c.status === 'PENDING_LIQUIDATION');
    const done = contracts.filter(c => c.status === 'LIQUIDATED');

    return (
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <div>
          <h1 className="page-title flex items-center gap-3"><AlertTriangle className="text-orange-600" /> Quản Lý Thanh Lý</h1>
          <p className="page-subtitle text-lg">Bán tài sản quá hạn để thu hồi vốn. Tiền bán sẽ tự động cộng vào Sổ Quỹ.</p>
        </div>
        <LiquidationsClient pending={pending} done={done} />
      </div>
    );
  } catch (e) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể tải dữ liệu thanh lý. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
