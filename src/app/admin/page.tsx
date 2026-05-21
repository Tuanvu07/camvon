import { prisma } from '@/lib/db';
import { approveUpgrade } from '@/actions/admin/approveUpgrade';
import SubmitButton from '@/components/SubmitButton';
import { Building2, Users, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const shops = await prisma.shop.findMany({
    orderBy: [
      { upgradeRequested: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      users: {
        where: { role: 'OWNER' },
        include: { user: true }
      }
    }
  });

  const totalShops = shops.length;
  const premiumShops = shops.filter(s => s.plan === 'PREMIUM').length;
  const mrr = premiumShops * 999000; // Monthly Recurring Revenue (Approximate for UI)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <Building2 size={80} className="absolute -right-4 -bottom-4 text-slate-800 opacity-50 group-hover:scale-110 transition-transform" />
          <h3 className="text-slate-400 font-bold mb-2">Tổng số Cửa Hàng</h3>
          <div className="text-5xl font-black text-white">{totalShops}</div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-emerald-900/50 transition-colors">
          <CheckCircle2 size={80} className="absolute -right-4 -bottom-4 text-emerald-900/30 group-hover:text-emerald-900/50 group-hover:scale-110 transition-all" />
          <h3 className="text-slate-400 font-bold mb-2">Đang Active (Premium)</h3>
          <div className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">{premiumShops}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/80 to-slate-900 border border-blue-800/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
          <DollarSign size={80} className="absolute -right-4 -bottom-4 text-blue-800/40" />
          <h3 className="text-blue-300 font-bold mb-2">MRR Ước Tính</h3>
          <div className="text-4xl font-black text-white">{formatCurrency(mrr)}</div>
          <div className="text-xs text-blue-400/80 mt-2 font-bold uppercase tracking-wide">Gói 999k/năm</div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-slate-800/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Users className="text-blue-500" /> Quản Lý Khách Hàng (Blind-Trust)
          </h2>
          <span className="text-xs font-black tracking-wider px-4 py-1.5 bg-slate-800 rounded-full text-slate-400 border border-slate-700">
            {totalShops} TENANTS
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Tên Cửa Hàng</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Chủ Sở Hữu</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Gói Cước</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Hạn Dùng</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {shops.map(shop => {
                const owner = shop.users[0]?.user;
                const isPremium = shop.plan === 'PREMIUM';
                const isExpired = shop.trialEndsAt && new Date() > shop.trialEndsAt && !isPremium;

                return (
                  <tr key={shop.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-lg">{shop.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1 opacity-70">ID: {shop.id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-300">{shop.ownerName || 'Chưa cập nhật'}</div>
                      <div className="text-sm text-slate-500">{owner?.email || '--'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-black tracking-wider ${isPremium ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {isPremium ? 'PREMIUM' : 'FREE TRIAL'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`font-bold text-sm ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                        {shop.trialEndsAt ? formatDate(shop.trialEndsAt) : '--'}
                      </div>
                      {isExpired && <div className="text-[11px] text-red-500 font-black tracking-widest uppercase mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> Đã khóa ghi</div>}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {shop.upgradeRequested ? (
                        <form action={approveUpgrade} className="inline-block relative">
                          <input type="hidden" name="shopId" value={shop.id} />
                          <div className="absolute -inset-1 bg-emerald-500/30 rounded-xl blur-md animate-pulse"></div>
                          <SubmitButton 
                            text="✅ Duyệt Nhận Tiền" 
                            className="relative bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95 border border-emerald-400/50"
                          />
                        </form>
                      ) : (
                        <div className="text-slate-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <div className="px-3 py-1.5 bg-slate-800 rounded-lg">Không có yêu cầu</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500 font-medium text-lg">Chưa có cửa hàng nào đăng ký vào hệ thống.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
