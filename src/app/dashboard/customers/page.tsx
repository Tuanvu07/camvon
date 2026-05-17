import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPhone } from '@/lib/utils';
import Link from 'next/link';
import { Users, Phone, UserPlus, CreditCard, ShieldAlert, Star } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: { q?: string };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId as string;
  const q = searchParams?.q || '';

  // Query database with search and includes
  const customers = await prisma.customer.findMany({
    where: {
      shopId,
      ...(q ? {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { cccdNumber: { contains: q } },
        ]
      } : {})
    },
    include: {
      contracts: {
        select: {
          id: true,
          status: true,
          pawningAmount: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate totals for summary metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => 
    c.contracts.some(ct => ['ACTIVE', 'INTEREST_DUE', 'PENDING_LIQUIDATION'].includes(ct.status))
  ).length;
  const badDebtCustomers = customers.filter(c => 
    c.contracts.some(ct => ['BAD_DEBT', 'OLD_DEBT'].includes(ct.status))
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Users size={28} className="text-blue-600" /> Quản lý Khách hàng
          </h1>
          <p className="page-subtitle">Danh bạ khách hàng và lịch sử tín dụng</p>
        </div>
        
        {/* Nút bấm khổng lồ - Thêm KH Mới */}
        <Link 
          href="/dashboard/customers/new" 
          className="btn btn-primary btn-lg flex-shrink-0 shadow-md shadow-blue-500/20"
        >
          <UserPlus size={22} />
          <span className="font-black">Thêm Khách Mới</span>
        </Link>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Tổng khách</div>
            <div className="text-2xl font-black text-slate-800">{totalCustomers}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CreditCard size={24} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Đang vay</div>
            <div className="text-2xl font-black text-slate-800">{activeCustomers}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={24} className="text-red-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Nợ xấu</div>
            <div className="text-2xl font-black text-slate-800">{badDebtCustomers}</div>
          </div>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="max-w-2xl">
        <SearchBar placeholder="Nhập Số điện thoại, Tên hoặc quét mã vạch CCCD..." />
      </div>

      {/* Danh sách KH (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {customers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <div className="text-lg font-medium">Không tìm thấy khách hàng nào.</div>
          </div>
        ) : (
          customers.map((c) => {
            // Phân loại trạng thái
            const activeContracts = c.contracts.filter(ct => ['ACTIVE', 'INTEREST_DUE', 'PENDING_LIQUIDATION'].includes(ct.status));
            const badContracts = c.contracts.filter(ct => ['BAD_DEBT', 'OLD_DEBT'].includes(ct.status));
            
            const totalActiveLoan = activeContracts.reduce((sum, ct) => sum + ct.pawningAmount, 0);

            // Xác định UI State
            let uiState = { border: 'border-slate-200', bg: 'bg-white', badge: '' };
            if (badContracts.length > 0) {
              uiState = { border: 'border-red-300 shadow-red-500/10', bg: 'bg-red-50', badge: 'bg-red-500' };
            } else if (activeContracts.length > 0) {
              uiState = { border: 'border-emerald-200 shadow-emerald-500/10', bg: 'bg-white', badge: 'bg-emerald-500' };
            }

            return (
              <div 
                key={c.id} 
                className={`rounded-2xl border ${uiState.border} ${uiState.bg} p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
              >
                {/* Trạng thái Indicator ở góc trên */}
                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${uiState.badge}`}></div>
                
                {/* Badge Status */}
                <div className="absolute top-3 right-3 z-10">
                  {badContracts.length > 0 && <ShieldAlert size={20} className="text-white drop-shadow-md" />}
                  {activeContracts.length > 0 && badContracts.length === 0 && <CreditCard size={20} className="text-white drop-shadow-md" />}
                  {c.status === 'VIP' && <Star size={20} className="text-amber-400 drop-shadow-md" fill="currentColor" />}
                </div>

                <div className="space-y-4">
                  {/* Avatar/Tên */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-200 flex flex-col items-center justify-center font-bold text-slate-500 flex-shrink-0 text-xl">
                      {c.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-xl text-slate-800 leading-tight pr-6">
                        {c.fullName}
                      </div>
                      <div className="text-sm font-semibold text-slate-500 mt-1">
                        CCCD: {c.cccdNumber || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>

                  {/* SĐT (Bấm gọi được) */}
                  <a 
                    href={c.phone ? `tel:${c.phone}` : '#'} 
                    className="flex items-center gap-2 p-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl transition-colors font-bold text-lg"
                  >
                    <Phone size={18} className="opacity-70" />
                    {c.phone ? formatPhone(c.phone) : 'Không có SĐT'}
                  </a>

                  {/* Tình trạng hợp đồng */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-slate-500">Đang vay ({activeContracts.length})</span>
                      <span className="font-black text-slate-800">{formatCurrency(totalActiveLoan)}</span>
                    </div>
                    {badContracts.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-red-500">Nợ xấu ({badContracts.length})</span>
                        <span className="font-bold text-red-600">!! CẢNH BÁO !!</span>
                      </div>
                    )}
                  </div>

                  {/* Hành động */}
                  <div className="pt-2">
                    <Link 
                      href={`/dashboard/customers/${c.id}`}
                      className="btn btn-outline w-full justify-center"
                    >
                      Xem Hồ Sơ
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
