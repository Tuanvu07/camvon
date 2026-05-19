import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReportPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  const userId = (session.user as any).id;
  const userName = (session.user as any).name || 'Nhân viên';

  // Lấy role từ database để phân quyền
  const shopUser = await prisma.shopUser.findUnique({ 
    where: { shopId_userId: { shopId, userId } } 
  });
  const role = shopUser?.role || 'STAFF'; // OWNER | ADMIN | STAFF

  // Blind trust: Lấy từ 0h hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nếu là STAFF, chỉ xem giao dịch do chính mình thực hiện. Nếu là OWNER/ADMIN thì xem hết ca của shop.
  const whereClause: any = { shopId, createdAt: { gte: today } };
  if (role === 'STAFF') {
    whereClause.userId = userId;
  }

  const txs = await prisma.transaction.findMany({ 
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      contract: { select: { contractCode: true } }
    }
  });

  const IN_TYPES = ['INTEREST_COLLECT', 'REDEEM_OUT', 'LIQUIDATION', 'INCOME', 'PAID_INTEREST', 'REPAY_PRINCIPAL', 'CLOSE_CONTRACT', 'FUND_TRANSFER'];
  const OUT_TYPES = ['PAWN_IN', 'EXPENSE'];

  const moneyIn = txs.filter(t => IN_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const moneyOut = txs.filter(t => OUT_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const diff = moneyIn - moneyOut;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <FileText className="text-blue-600"/> 
            Báo Cáo Đối Soát Chốt Ca
          </h1>
          <p className="page-subtitle text-lg font-medium text-slate-500 mt-2">
            Ca làm việc của: <span className="text-slate-800 font-bold">{userName}</span> 
            {role === 'STAFF' && <span className="ml-2 text-red-500 text-sm">(Chế độ mù: Chỉ thấy số liệu cá nhân)</span>}
            {role !== 'STAFF' && <span className="ml-2 text-emerald-600 text-sm">(Chế độ quản lý: Toàn bộ cửa hàng)</span>}
          </p>
        </div>

        {role !== 'STAFF' && (
          <a href="/api/export/csv" download className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
            📥 Tải Sổ Sách Về Máy (Excel/CSV)
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-emerald-700 font-bold text-xl mb-2 flex items-center gap-2">
            <TrendingUp size={28}/> TỔNG THU VÀO TRONG CA
          </div>
          <div className="text-5xl md:text-6xl font-black text-emerald-600">{formatCurrency(moneyIn)}</div>
          <div className="mt-4 text-emerald-800 font-medium opacity-80">Bao gồm: Tiền thu lãi, chuộc đồ, thanh lý...</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-red-700 font-bold text-xl mb-2 flex items-center gap-2">
            <TrendingDown size={28}/> TỔNG CHI RA TRONG CA
          </div>
          <div className="text-5xl md:text-6xl font-black text-red-600">{formatCurrency(moneyOut)}</div>
          <div className="mt-4 text-red-800 font-medium opacity-80">Bao gồm: Tiền giải ngân hợp đồng mới, chi phí...</div>
        </div>
      </div>
      
      <div className={`rounded-3xl p-8 text-center border-2 shadow-lg relative overflow-hidden ${diff >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className={`text-2xl font-black mb-1 ${diff >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
          CHÊNH LỆCH TIỀN MẶT CẦN BÀN GIAO:
        </div>
        <div className={`text-6xl md:text-7xl font-black mt-4 ${diff >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
        </div>
        <div className={`mt-4 font-bold ${diff >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          {diff >= 0 ? 'Nhân viên nộp lại tiền mặt cho cửa hàng' : 'Cửa hàng đang âm quỹ ca này'}
        </div>
      </div>

      <div className="card mt-8">
        <div className="card-header bg-slate-50 flex items-center gap-2">
          <Clock className="text-slate-500" size={20} />
          <h2 className="font-bold text-slate-700">Chi tiết {txs.length} giao dịch hôm nay</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="lendos-table min-w-full">
            <thead>
              <tr className="bg-white">
                <th className="py-4">Thời gian</th>
                <th className="py-4">Mã HĐ</th>
                <th className="py-4">Nội dung</th>
                <th className="py-4 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(tx => {
                const isIn = IN_TYPES.includes(tx.type);
                return (
                  <tr key={tx.id}>
                    <td className="font-medium">{formatDateTime(tx.createdAt)}</td>
                    <td className="font-bold text-blue-600">{tx.contract?.contractCode || '--'}</td>
                    <td>{tx.description}</td>
                    <td className={`text-right font-black font-mono text-lg ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIn ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })}
              {txs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">Không có giao dịch nào trong ca.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
