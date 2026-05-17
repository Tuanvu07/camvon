import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ShopDetailPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  const [shop, contracts] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId } }),
    prisma.contract.findMany({ where: { shopId }, select: { status: true, pawningAmount: true, totalInterestPaid: true } }),
  ]);

  const openContracts   = contracts.filter(c => ['ACTIVE','INTEREST_DUE'].includes(c.status));
  const closedContracts = contracts.filter(c => ['REDEEMED','LIQUIDATED'].includes(c.status));
  const capital         = openContracts.reduce((s, c) => s + c.pawningAmount, 0);
  const totalPaid       = contracts.reduce((s, c) => s + c.totalInterestPaid, 0);

  const rows = (label: string, value: React.ReactNode, highlight = false) => (
    <div className={`flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 ${highlight ? 'font-black text-blue-600' : ''}`}>
      <span className="text-slate-600 text-sm">{label}</span>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Cửa hàng: {shop?.name}</h1>
        <div className="flex gap-6 text-sm text-slate-500 mt-1 flex-wrap">
          {shop?.phone && <span>📞 {shop.phone}</span>}
          {shop?.address && <span>📍 {shop.address}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header"><h2 className="card-title">📊 Thông tin vốn</h2></div>
          <div className="card-body">
            {rows('Vốn đầu tư', formatCurrency(shop?.initialCapital ?? 0))}
            {rows('Quỹ tiền mặt', formatCurrency(shop?.cashBalance ?? 0))}
            {rows('Tiền đang cho vay', formatCurrency(capital), true)}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">💰 Thông tin lãi phí</h2></div>
          <div className="card-body">
            {rows('Lãi phí đã thu', formatCurrency(totalPaid))}
            {rows('Lãi phí chưa thu', formatCurrency(Math.max(0, capital * 0.03)))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">📋 Thông tin hợp đồng</h2></div>
          <div className="card-body">
            {rows('Hợp đồng đang mở', openContracts.length)}
            {rows('Hợp đồng đã đóng', closedContracts.length)}
            {rows('Tổng số hợp đồng', contracts.length, true)}
            {rows('HĐ nợ lãi phí', contracts.filter(c => c.status === 'INTEREST_DUE').length)}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">💸 Thu / Chi</h2></div>
          <div className="card-body">
            {rows('Chi tiêu', 0)}
            {rows('Thu bất thường', 0)}
            {rows('Tổng tiền khách nợ', 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
