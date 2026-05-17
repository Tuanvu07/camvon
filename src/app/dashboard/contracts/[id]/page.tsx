import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate, formatInterestRate } from '@/lib/utils';
import { calculateInterest, overdueDays } from '@/lib/math';
import Link from 'next/link';
import { ArrowLeft, Printer, DollarSign, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { RateType, InterestCycle } from '@/types';

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  const contract = await prisma.contract.findFirst({
    where: { id: params.id, shopId },
    include: { customer: true, transactions: { orderBy: { transactionDate: 'desc' }, take: 10 } },
  });

  if (!contract) notFound();

  const interest = calculateInterest(
    contract.pawningAmount,
    contract.interestRateType as RateType,
    contract.interestRateValue,
    contract.interestCycle as InterestCycle,
    contract.startDate,
  );

  const od = overdueDays(contract.interestDueDate);
  const unpaidInterest = Math.max(0, interest.accruedInterest - contract.totalInterestPaid);
  const redemptionTotal = contract.pawningAmount + unpaidInterest;

  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Đang cầm', INTEREST_DUE: 'Chậm lãi phí',
    PENDING_LIQUIDATION: 'Chờ thanh lý', REDEEMED: 'Đã chuộc',
    LIQUIDATED: 'Đã thanh lý', OLD_DEBT: 'Nợ cũ', BAD_DEBT: 'Nợ xấu',
  };
  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'bg-emerald-500', INTEREST_DUE: 'bg-amber-500',
    PENDING_LIQUIDATION: 'bg-orange-500', REDEEMED: 'bg-blue-500',
    LIQUIDATED: 'bg-slate-500',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/contracts" className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Quay lại
          </Link>
          <div>
            <h1 className="page-title">{contract.contractCode}</h1>
            <p className="page-subtitle">Chi tiết hợp đồng cầm đồ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm"><Printer size={15} /> In bill</button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`${STATUS_COLOR[contract.status] ?? 'bg-slate-500'} text-white rounded-xl px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 font-bold text-lg">
          {contract.status === 'ACTIVE' && <CheckCircle size={22} />}
          {contract.status === 'INTEREST_DUE' && <Clock size={22} />}
          {contract.status === 'PENDING_LIQUIDATION' && <AlertTriangle size={22} />}
          {STATUS_LABEL[contract.status] ?? contract.status}
          {od > 0 && <span className="text-sm opacity-80 ml-1">({od} ngày trễ)</span>}
        </div>
        <div className="text-sm opacity-90">
          Lãi tích lũy: <strong>{formatCurrency(interest.accruedInterest)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">👤 Khách hàng</h2></div>
          <div className="card-body space-y-2">
            {[
              ['Họ tên', contract.customer.fullName],
              ['CCCD/HC', contract.customer.cccdNumber],
              ['Điện thoại', contract.customer.phone],
              ['Địa chỉ', contract.customer.address],
            ].map(([l, v]) => v && (
              <div key={l} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-500 font-medium">{l}:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">📦 Tài sản</h2></div>
          <div className="card-body space-y-2">
            {[
              ['Loại', contract.assetType],
              ['Hãng / Dòng', [contract.assetBrand, contract.assetModel].filter(Boolean).join(' ')],
              ['Biển số', contract.assetPlate],
              ['IMEI', contract.assetImei],
              ['Ghi chú', contract.assetNote],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-500 font-medium">{l}:</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">💰 Tài chính</h2></div>
          <div className="card-body space-y-2">
            {[
              ['Tiền cầm',      formatCurrency(contract.pawningAmount)],
              ['Lãi suất',      formatInterestRate(contract.interestRateType as RateType, contract.interestRateValue, contract.interestCycle as InterestCycle)],
              ['Ngày cầm',      formatDate(contract.startDate)],
              ['Đóng lãi tiếp', formatDate(contract.interestDueDate)],
              ['Lãi đã thu',    formatCurrency(contract.totalInterestPaid)],
              ['Lãi tích lũy',  formatCurrency(interest.accruedInterest)],
              ['Lãi chưa thu',  formatCurrency(unpaidInterest)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-500 font-medium">{l}:</span>
                <span className="font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">⚡ Thao tác nhanh</h2></div>
          <div className="card-body grid gap-3">
            {unpaidInterest > 0 && (
              <button className="btn btn-success btn-lg w-full">
                <DollarSign size={20} /> Thu lãi • {formatCurrency(unpaidInterest)}
              </button>
            )}
            <button className="btn btn-primary btn-lg w-full">
              <CheckCircle size={20} /> Chuộc đồ • {formatCurrency(redemptionTotal)}
            </button>
            <button className="btn btn-warning btn-lg w-full">
              <AlertTriangle size={20} /> Thanh lý tài sản
            </button>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      {contract.transactions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header"><h2 className="card-title">🧾 Lịch sử giao dịch</h2></div>
          <div className="overflow-x-auto">
            <table className="lendos-table">
              <thead><tr><th>Ngày</th><th>Loại</th><th>Số tiền</th><th>Ghi chú</th></tr></thead>
              <tbody>
                {contract.transactions.map(t => (
                  <tr key={t.id}>
                    <td className="text-sm text-slate-500">{formatDate(t.transactionDate)}</td>
                    <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{t.type}</span></td>
                    <td className={`font-bold ${t.amount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </td>
                    <td className="text-sm text-slate-500">{t.description ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
