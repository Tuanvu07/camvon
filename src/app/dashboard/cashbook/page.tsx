import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { Wallet, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TX_INFO: Record<string, { label: string; color: string; sign: '+' | '-'; bg: string }> = {
  PAWN_IN: { label: 'Giải ngân (Cho vay)', color: 'text-red-600', sign: '-', bg: 'bg-red-50' },
  INTEREST_COLLECT: { label: 'Thu lãi phí', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  REDEEM_OUT: { label: 'Tất toán chuộc đồ', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  LIQUIDATION: { label: 'Thanh lý tài sản', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  EXPENSE: { label: 'Chi phí khác', color: 'text-red-600', sign: '-', bg: 'bg-red-50' },
  INCOME: { label: 'Thu nhập khác', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  FUND_TRANSFER: { label: 'Chuyển quỹ', color: 'text-slate-600', sign: '+', bg: 'bg-slate-50' },
  PAID_INTEREST: { label: 'Đóng lãi', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  REPAY_PRINCIPAL: { label: 'Trả bớt gốc', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
  CLOSE_CONTRACT: { label: 'Đóng hợp đồng', color: 'text-emerald-600', sign: '+', bg: 'bg-emerald-50' },
};

export default async function CashbookPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId as string;

  // 1. Fetch Shop Balance & Transactions Parallelly
  const [shop, transactions] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { cashBalance: true, initialCapital: true, name: true }
    }),
    prisma.transaction.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          select: { contractCode: true, customer: { select: { fullName: true } } }
        }
      },
      take: 100 // Giới hạn 100 giao dịch gần nhất cho an toàn hiệu năng
    })
  ]);

  if (!shop) {
    return <div className="p-8 text-center text-red-500 font-bold">Không tìm thấy thông tin Cửa hàng.</div>;
  }

  // Calculate some simple stats for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIncome = transactions
    .filter(t => new Date(t.createdAt) >= today && TX_INFO[t.type]?.sign === '+')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = transactions
    .filter(t => new Date(t.createdAt) >= today && TX_INFO[t.type]?.sign === '-')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Sổ Quỹ Tiền Mặt</h1>
        <p className="page-subtitle">Theo dõi dòng tiền ra/vào của {shop.name}</p>
      </div>

      {/* Hero Metrics (Elders First - Huge Text) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
          <Wallet size={120} className="absolute -right-6 -bottom-6 text-white/10" />
          <div className="text-blue-100 font-semibold mb-2 flex items-center gap-2 text-lg">
            Tổng Tiền Mặt Hiện Tại
          </div>
          <div className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-sm">
            {formatCurrency(shop.cashBalance)}
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500/50 flex gap-6 text-sm font-medium text-blue-100">
            <span>Vốn ban đầu: {formatCurrency(shop.initialCapital)}</span>
            <span>Lợi nhuận tạm tính: {formatCurrency(shop.cashBalance - shop.initialCapital)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-center">
            <div className="text-slate-500 font-semibold text-sm mb-1 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Hôm nay thu vào
            </div>
            <div className="text-3xl font-black text-emerald-600">{formatCurrency(todayIncome)}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-center">
            <div className="text-slate-500 font-semibold text-sm mb-1 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" /> Hôm nay chi ra
            </div>
            <div className="text-3xl font-black text-red-600">{formatCurrency(todayExpense)}</div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="card overflow-hidden">
        <div className="card-header bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử giao dịch</h2>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              100 gần nhất
            </span>
          </div>
          <div className="relative">
            <input 
              type="text" 
              disabled
              placeholder="Tính năng tìm kiếm sắp ra mắt..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 opacity-60 cursor-not-allowed"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="lendos-table min-w-full">
            <thead>
              <tr className="bg-white">
                <th className="py-4 text-sm">Thời gian</th>
                <th className="py-4 text-sm">Loại giao dịch</th>
                <th className="py-4 text-sm">Nội dung</th>
                <th className="py-4 text-sm text-right">Số tiền</th>
                <th className="py-4 text-sm">Người thực hiện</th>
                <th className="py-4 text-sm text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Clock size={40} className="mx-auto mb-3 opacity-20" />
                    <div className="text-lg font-medium">Chưa có giao dịch nào</div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const info = TX_INFO[tx.type] || { label: tx.type, color: 'text-slate-600', sign: '', bg: 'bg-slate-50' };
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-slate-700">{formatDateTime(tx.transactionDate || tx.createdAt)}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${info.color} ${info.bg}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="py-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">
                          {tx.description || '--'}
                        </div>
                        {tx.contract && (
                          <div className="text-sm mt-0.5 flex items-center gap-1">
                            <span className="text-slate-500">HĐ:</span>
                            <Link href={`/dashboard/contracts/${tx.contractId}`} className="font-bold text-blue-600 hover:underline">
                              {tx.contract.contractCode}
                            </Link>
                            <span className="text-slate-400 mx-1">•</span>
                            <span className="text-slate-600 font-medium truncate">{tx.contract.customer?.fullName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className={`text-xl font-black font-mono tracking-tight ${info.color}`}>
                          {info.sign} {formatCurrency(tx.amount)}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {(tx.staffName || 'A')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{tx.staffName || 'Admin'}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <PrintButton
                          data={{
                            shopName: shop.name,
                            transactionId: tx.id,
                            date: tx.transactionDate || tx.createdAt,
                            typeLabel: info.label,
                            amount: tx.amount,
                            contractCode: tx.contract?.contractCode,
                            customerName: tx.contract?.customer?.fullName,
                            staffName: tx.staffName || 'Admin',
                            note: tx.note || tx.description || undefined,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
