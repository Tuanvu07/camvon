import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import ContractsClient from '@/app/dashboard/contracts/ContractsClient';
import { TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InstallmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  
  try {
    // Tạm thời lấy tất cả Hợp đồng để đảm bảo hiển thị dữ liệu (Theo yêu cầu tái sử dụng UI Cầm đồ)
    // Thực tế sẽ cần phân loại dựa trên interestCycle hoặc interestRateType trong tương lai.
    const contracts = await prisma.contract.findMany({
      where: { shopId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = contracts.length;
    const totalPawned = contracts.reduce((sum, c) => sum + Number(c.pawningAmount || 0), 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-title flex items-center gap-3"><TrendingDown className="text-blue-600" /> Quản Lý Trả Góp / Bốc Họ</h1>
          <p className="page-subtitle text-lg">Giao diện được đồng bộ 100% với Quản lý Cầm đồ để tối ưu trải nghiệm Elders-First.</p>
        </div>
        <ContractsClient contracts={contracts as any} shopId={shopId} totalCount={totalCount} totalPawned={totalPawned} />
      </div>
    );
  } catch (e) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể tải dữ liệu hợp đồng trả góp. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
