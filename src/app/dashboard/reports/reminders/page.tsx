import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calcAccruedInterest, overdueDays } from '@/lib/math';
import type { RateType, InterestCycle } from '@/types';

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  const contracts = await prisma.contract.findMany({
    where: { shopId, status: { in: ['INTEREST_DUE', 'PENDING_LIQUIDATION'] } },
    include: { customer: true },
    orderBy: { interestDueDate: 'asc' },
  });

  const allContracts = await prisma.contract.findMany({ where: { shopId }, select: { status: true, pawningAmount: true } });
  const statCards = [
    { label: 'Tổng HĐ đang cầm', value: allContracts.filter(c => ['ACTIVE','INTEREST_DUE'].includes(c.status)).length, sub: 'hợp đồng', cls: 'stat-card-blue' },
    { label: 'Chậm lãi phí',     value: allContracts.filter(c => c.status === 'INTEREST_DUE').length,            sub: 'khách', cls: 'stat-card-amber' },
    { label: 'Chờ thanh lý',     value: allContracts.filter(c => c.status === 'PENDING_LIQUIDATION').length,     sub: 'tài sản', cls: 'stat-card-orange' },
    { label: 'Vốn đang cầm',     value: formatCurrency(allContracts.filter(c => ['ACTIVE','INTEREST_DUE'].includes(c.status)).reduce((s,c)=>s+c.pawningAmount,0)), sub: 'tổng vốn', cls: 'stat-card-rose' },
    { label: 'Lãi chưa thu',     value: formatCurrency(contracts.reduce((s,c)=>s+calcAccruedInterest(c.pawningAmount,c.interestRateType as RateType,c.interestRateValue,c.interestCycle as InterestCycle,c.startDate)-c.totalInterestPaid, 0)), sub: 'tổng lãi', cls: 'stat-card-red' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Báo cáo nhắc nợ</h1>
          <p className="page-subtitle">{contracts.length} hợp đồng cần xử lý • {formatDate(new Date())}</p>
        </div>
        <button className="btn btn-success btn-sm">📨 Gửi Zalo tất cả</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
        {statCards.map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="text-2xl font-black mb-1">{s.value}</div>
            <div className="text-xs font-semibold opacity-90">{s.label}</div>
            <div className="text-xs opacity-60 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">⚠️ Danh sách nhắc nợ ({contracts.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead><tr><th>#</th><th>Mã HĐ</th><th>Khách hàng</th><th>SĐT</th><th>Tài sản</th><th>Tiền cầm</th><th>Lãi chưa thu</th><th>Trễ hạn</th><th>Thao tác</th></tr></thead>
            <tbody>
              {contracts.map((c, i) => {
                const od = overdueDays(c.interestDueDate);
                const unpaid = calcAccruedInterest(c.pawningAmount,c.interestRateType as RateType,c.interestRateValue,c.interestCycle as InterestCycle,c.startDate) - c.totalInterestPaid;
                return (
                  <tr key={c.id}>
                    <td className="text-slate-400 text-xs">{i + 1}</td>
                    <td className="font-bold text-blue-600">{c.contractCode}</td>
                    <td className="font-semibold">{c.customer.fullName}</td>
                    <td className="text-slate-600">{c.customer.phone ?? '--'}</td>
                    <td className="text-sm">{[c.assetBrand,c.assetModel,c.assetPlate].filter(Boolean).join(' ') || '--'}</td>
                    <td className="font-bold">{formatCurrency(c.pawningAmount)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(Math.max(0,unpaid))}</td>
                    <td><span className={`status-badge ${od > 10 ? 'status-pending' : 'status-due'}`}>{od} ngày</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-icon text-green-600 hover:bg-green-50" title="Gửi Zalo">💬</button>
                        <button className="btn-icon text-blue-600 hover:bg-blue-50" title="Thu lãi">💰</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-slate-400">🎉 Không có hợp đồng nào trễ hạn!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
