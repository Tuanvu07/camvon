import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default async function CashBookPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [shop, transactions] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId } }),
    prisma.transaction.findMany({
      where: { shopId, transactionDate: { gte: today, lt: tomorrow } },
      include: { contract: { include: { customer: true } } },
      orderBy: { transactionDate: 'asc' },
    }),
  ]);

  const pawnOut     = transactions.filter(t => t.type === 'PAWN_IN').reduce((s,t) => s + Math.abs(t.amount), 0);
  const interestIn  = transactions.filter(t => t.type === 'INTEREST_COLLECT').reduce((s,t) => s + t.amount, 0);
  const redeemIn    = transactions.filter(t => t.type === 'REDEEM_OUT').reduce((s,t) => s + t.amount, 0);
  const openBalance = (shop?.cashBalance ?? 0) + pawnOut - interestIn - redeemIn;
  const closeBalance = shop?.cashBalance ?? 0;

  const TYPE_LBL: Record<string,string> = {
    PAWN_IN: 'Cầm đồ', INTEREST_COLLECT: 'Thu lãi', REDEEM_OUT: 'Chuộc đồ',
    LIQUIDATION: 'Thanh lý', EXPENSE: 'Chi tiêu', INCOME: 'Thu khác',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Sổ quỹ tiền mặt</h1>
          <p className="page-subtitle">{formatDate(new Date())}</p>
        </div>
        <button className="btn btn-outline btn-sm">🖨️ In</button>
      </div>

      <div className="card">
        <div className="card-body py-3 flex gap-3 flex-wrap items-end">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Từ ngày:</label>
            <input type="date" defaultValue={formatDate(today).split('/').reverse().join('-')} className="input w-40 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Đến ngày:</label>
            <input type="date" defaultValue={formatDate(today).split('/').reverse().join('-')} className="input w-40 py-2 text-sm" />
          </div>
          <button className="btn btn-primary btn-sm">🔍 Tìm kiếm</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-slate-700 text-white px-5 py-3 font-bold text-center">Bảng Tổng Kết Ngày</div>
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead><tr><th>Quỹ đầu kỳ</th><th>Cầm đồ (chi)</th><th>Thu lãi</th><th>Chuộc đồ</th><th>Quỹ cuối kỳ</th></tr></thead>
            <tbody>
              <tr>
                <td className="font-black text-blue-600 text-lg">+{formatCurrency(openBalance)}</td>
                <td className="font-bold text-red-500">{pawnOut > 0 ? `-${formatCurrency(pawnOut)}` : '0'}</td>
                <td className="font-bold text-emerald-600">{interestIn > 0 ? `+${formatCurrency(interestIn)}` : '0'}</td>
                <td className="font-bold text-emerald-600">{redeemIn > 0 ? `+${formatCurrency(redeemIn)}` : '0'}</td>
                <td className="font-black text-emerald-600 text-lg">+{formatCurrency(closeBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-slate-700 text-white px-5 py-3 font-bold">Giao dịch trong ngày ({transactions.length})</div>
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead><tr><th>#</th><th>Mã HĐ</th><th>Nhân viên</th><th>Khách hàng</th><th>Tài sản</th><th>Thời gian</th><th>Loại GD</th><th>Số tiền</th></tr></thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={t.id}>
                  <td className="text-slate-400 text-xs">{i+1}</td>
                  <td className="font-bold text-blue-600">{t.contract?.contractCode ?? '--'}</td>
                  <td className="text-sm text-slate-600">{t.staffName ?? '--'}</td>
                  <td className="font-medium">{t.contract?.customer?.fullName ?? '--'}</td>
                  <td className="text-sm text-slate-500">{t.description}</td>
                  <td className="text-sm text-slate-500 whitespace-nowrap">{formatDateTime(t.transactionDate)}</td>
                  <td><span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">{TYPE_LBL[t.type] ?? t.type}</span></td>
                  <td className={`font-bold whitespace-nowrap ${t.amount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">Chưa có giao dịch nào trong ngày</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
