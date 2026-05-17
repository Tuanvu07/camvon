import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  
  try {
    const activeContracts = await prisma.contract.findMany({
      where: { shopId, status: { in: ['ACTIVE', 'INTEREST_DUE', 'PENDING_LIQUIDATION', 'OLD_DEBT', 'BAD_DEBT'] } }
    });
    const totalLoanCapital = activeContracts.reduce((sum, c) => sum + c.pawningAmount, 0);
    
    const interestTransactions = await prisma.transaction.findMany({
      where: { shopId, type: { in: ['PAID_INTEREST', 'INTEREST_COLLECT', 'INCOME'] } }
    });
    const totalInterestCollected = interestTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const liquidationTxs = await prisma.transaction.findMany({
      where: { shopId, type: 'LIQUIDATION' }
    });
    const totalLiquidation = liquidationTxs.reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalInterestCollected + totalLiquidation;
    
    const maxBar = Math.max(totalLoanCapital, netProfit, 1);
    const capitalPct = (totalLoanCapital / maxBar) * 100;
    const profitPct = (netProfit / maxBar) * 100;

    return (
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        <div>
          <h1 className="page-title flex items-center gap-3"><BarChart2 className="text-blue-600" /> Thống Kê Tổng Quát</h1>
          <p className="page-subtitle text-xl">Báo cáo hiệu quả kinh doanh nhanh (Real-time). Không cần chờ chốt sổ.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 border-l-8 border-l-blue-500 bg-blue-50/50 shadow-lg">
            <p className="text-slate-500 font-black text-xl mb-3 flex items-center gap-2 uppercase tracking-wide"><DollarSign /> TỔNG VỐN ĐANG CHO VAY</p>
            <div className="text-4xl lg:text-5xl font-black text-slate-800">{formatCurrency(totalLoanCapital)}</div>
          </div>
          <div className="card p-8 border-l-8 border-l-emerald-500 bg-emerald-50/50 shadow-lg">
            <p className="text-slate-500 font-black text-xl mb-3 flex items-center gap-2 uppercase tracking-wide"><TrendingUp /> TỔNG LÃI ĐÃ THU</p>
            <div className="text-4xl lg:text-5xl font-black text-emerald-600">{formatCurrency(totalInterestCollected)}</div>
          </div>
          <div className="card p-8 border-l-8 border-l-orange-500 bg-orange-50/50 shadow-lg">
            <p className="text-slate-500 font-black text-xl mb-3 flex items-center gap-2 uppercase tracking-wide"><Activity /> THU TỪ THANH LÝ</p>
            <div className="text-4xl lg:text-5xl font-black text-orange-600">{formatCurrency(totalLiquidation)}</div>
          </div>
        </div>

        <div className="card p-12 border-4 border-slate-200 shadow-xl">
          <h2 className="text-3xl font-black text-slate-800 mb-12 flex items-center gap-3">
            <BarChart2 size={36} className="text-blue-600" /> Biểu Đồ Tỷ Trọng (Vốn / Thu Nhập)
          </h2>

          <div className="space-y-16">
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-2xl font-bold text-slate-700">Dư nợ gốc (Đang quay vòng)</span>
                <span className="text-4xl font-black text-blue-600">{formatCurrency(totalLoanCapital)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-12 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(capitalPct, 2)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-2xl font-bold text-slate-700">Tổng thu nhập (Lãi + Thanh lý)</span>
                <span className="text-4xl font-black text-emerald-600">{formatCurrency(netProfit)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-12 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(profitPct, 2)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 p-8 bg-blue-50 rounded-3xl border-2 border-blue-200 text-center shadow-inner">
            <p className="text-2xl font-bold text-blue-800 flex items-center justify-center gap-4">
              <span>Hiệu suất sinh lời ước tính:</span>
              <span className="text-5xl font-black text-blue-600 bg-white px-6 py-2 rounded-2xl shadow-sm border border-blue-100">
                {totalLoanCapital > 0 ? ((netProfit / totalLoanCapital) * 100).toFixed(1) : 0}%
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
