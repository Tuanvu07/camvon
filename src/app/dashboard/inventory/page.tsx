import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Boxes } from 'lucide-react';
import InventoryClient from './InventoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  
  try {
    const contracts = await prisma.contract.findMany({
      where: { 
        shopId,
        status: { in: ['ACTIVE', 'PENDING_LIQUIDATION'] }
      },
      include: {
        customer: { select: { fullName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return (
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div>
          <h1 className="page-title flex items-center gap-3"><Boxes className="text-blue-600" /> Quản Lý Kho Tài Sản</h1>
          <p className="page-subtitle text-lg mt-1">Kiểm kê nhanh hàng hóa đang được lưu trữ tại cửa hàng bằng thanh tìm kiếm Real-time.</p>
        </div>

        <InventoryClient contracts={contracts} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể tải dữ liệu kho. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
