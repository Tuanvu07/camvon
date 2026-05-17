// LendOS - Dashboard Page
// Server Component - kết nối Prisma thực, tính toán lãi dự kiến hôm nay
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calcAccruedInterest } from '@/lib/math';
import type { RateType, InterestCycle } from '@/types';
import Link from 'next/link';
import {
  TrendingUp, Wallet, FileText, Users, ArrowRight, Plus,
  Clock, AlertTriangle, TrendingDown, Banknote
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  // ── Truy vấn song song để tối ưu tốc độ ──
  const [shop, contractsRaw, customers, todayTransactions] = await Promise.all([
    // 1. Thông tin shop (bao gồm cashBalance thực tế)
    prisma.shop.findUnique({
      where:  { id: shopId },
      select: { name: true, cashBalance: true, initialCapital: true },
    }),

    // 2. Tất cả hợp đồng đang hoạt động để tính toán
    prisma.contract.findMany({
      where:  { shopId, status: { notIn: ['CLOSED', 'LIQUIDATED'] } },
      select: {
        id:               true,
        status:           true,
        pawningAmount:    true,
        interestRateType: true,
        interestRateValue: true,
        interestCycle:    true,
        startDate:        true,
        totalInterestPaid: true,
        interestDueDate:  true,
      },
    }),

    // 3. Tổng số khách hàng
    prisma.customer.count({ where: { shopId } }),

    // 4. Giao dịch hôm nay để tính lãi thực thu
    prisma.transaction.aggregate({
      where: {
        shopId,
        type: { in: ['INTEREST_COLLECT', 'PAID_INTEREST'] },
        transactionDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt:  new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  // ── Phân loại hợp đồng theo trạng thái ──
  const active      = contractsRaw.filter(c => c.status === 'ACTIVE').length;
  const interestDue = contractsRaw.filter(c => c.status === 'INTEREST_DUE').length;
  const pendingLiq  = contractsRaw.filter(c => c.status === 'PENDING_LIQUIDATION').length;
  const oldDebt     = contractsRaw.filter(c => c.status === 'OLD_DEBT').length;
  const badDebt     = contractsRaw.filter(c => c.status === 'BAD_DEBT').length;

  // ── Tổng vốn đang cho vay (ACTIVE + INTEREST_DUE) ──
  const totalLoanCapital = contractsRaw
    .filter(c => ['ACTIVE', 'INTEREST_DUE', 'PENDING_LIQUIDATION'].includes(c.status))
    .reduce((sum, c) => sum + c.pawningAmount, 0);

  // ── Lãi dự kiến thu hôm nay (dùng math.ts) ──
  // Quét các hợp đồng có nextInterestDate <= hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueToday = contractsRaw.filter(c => {
    if (!c.interestDueDate) return false;
    return new Date(c.interestDueDate) <= new Date();
  });

  const estimatedInterestToday = dueToday.reduce((sum, c) => {
    const accrued = calcAccruedInterest(
      c.pawningAmount,
      c.interestRateType as RateType,
      c.interestRateValue,
      c.interestCycle as InterestCycle,
      new Date(c.startDate),
      new Date(),
    );
    return sum + Math.max(0, accrued - c.totalInterestPaid);
  }, 0);

  const interestCollectedToday = todayTransactions._sum.amount ?? 0;

  // ── Truy vấn hợp đồng gần đây ──
  const recentContracts = await prisma.contract.findMany({
    where:   { shopId },
    include: { customer: { select: { fullName: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
    take:    10,
  });

  // ── Stat Cards Data ──
  const statCards = [
    {
      label: 'Đang cầm',
      value: active,
      sub:   `${formatCurrency(totalLoanCapital)}`,
      cls:   'stat-card-blue',
      href:  '/dashboard/contracts?status=ACTIVE',
      icon:  <FileText size={20} />,
    },
    {
      label: 'Đến hạn lãi',
      value: interestDue,
      sub:   'Cần thu lãi ngay',
      cls:   'stat-card-amber',
      href:  '/dashboard/reports/reminders',
      icon:  <Clock size={20} />,
    },
    {
      label: 'Chờ thanh lý',
      value: pendingLiq,
      sub:   'Quá hạn > 10 ngày',
      cls:   'stat-card-orange',
      href:  '/dashboard/liquidation/pending',
      icon:  <AlertTriangle size={20} />,
    },
    {
      label: 'Nợ cũ',
      value: oldDebt,
      sub:   'Cần xử lý gấp',
      cls:   'stat-card-red',
      href:  '/dashboard/contracts?status=OLD_DEBT',
      icon:  <TrendingDown size={20} />,
    },
    {
      label: 'Nợ xấu',
      value: badDebt,
      sub:   'Mất khả năng thu',
      cls:   'stat-card-rose',
      href:  '/dashboard/contracts?status=BAD_DEBT',
      icon:  <TrendingDown size={20} />,
    },
  ];

  const STATUS_LBL: Record<string, string> = {
    ACTIVE: 'Đang cầm', INTEREST_DUE: 'Chậm lãi',
    PENDING_LIQUIDATION: 'Chờ TL', OLD_DEBT: 'Nợ cũ', BAD_DEBT: 'Nợ xấu',
  };
  const STATUS_CLS: Record<string, string> = {
    ACTIVE: 'status-badge status-active',
    INTEREST_DUE: 'status-badge status-due',
    PENDING_LIQUIDATION: 'status-badge status-pending',
    OLD_DEBT: 'status-badge status-old-debt',
    BAD_DEBT: 'status-badge status-bad-debt',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Bảng điều khiển</h1>
          <p className="page-subtitle">{shop?.name} • {formatDate(new Date())}</p>
        </div>
        <Link href="/dashboard/contracts/creation" className="btn btn-primary btn-lg">
          <Plus size={20} /> Cầm đồ mới
        </Link>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
        {statCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className={`stat-card ${card.cls}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="text-3xl font-black mb-1">{card.value}</div>
            <div className="text-sm font-bold opacity-90">{card.label}</div>
            <div className="text-xs opacity-70 mt-1">{card.sub}</div>
            <ArrowRight size={14} className="absolute top-4 right-4 opacity-40" />
          </Link>
        ))}
      </div>

      {/* Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quỹ tiền mặt - lấy từ shop.cashBalance (dữ liệu thực) */}
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500">Quỹ tiền mặt</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(shop?.cashBalance ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Vốn đầu tư: {formatCurrency(shop?.initialCapital ?? 0)}
          </div>
        </div>

        {/* Tiền đang cầm - _sum của ACTIVE + INTEREST_DUE + PENDING */}
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500">Vốn đang cho vay</span>
          </div>
          <div className="text-2xl font-black text-blue-600">
            {formatCurrency(totalLoanCapital)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {active + interestDue + pendingLiq} hợp đồng đang mở
          </div>
        </div>

        {/* Lãi dự kiến hôm nay - tính từ math.ts */}
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Banknote size={20} className="text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500">Lãi cần thu hôm nay</span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {formatCurrency(estimatedInterestToday)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {dueToday.length} hợp đồng đến hạn
          </div>
        </div>

        {/* Lãi đã thu hôm nay */}
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users size={20} className="text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500">Khách hàng</span>
          </div>
          <div className="text-2xl font-black text-violet-600">{customers}</div>
          <div className="text-xs text-slate-400 mt-1">
            Đã thu hôm nay: {formatCurrency(interestCollectedToday)}
          </div>
        </div>
      </div>

      {/* Recent Contracts Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Hợp đồng gần đây</h2>
          <Link href="/dashboard/contracts" className="btn btn-ghost btn-sm">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Loại</th>
                <th>Tiền cầm</th>
                <th>Ngày cầm</th>
                <th>Tình trạng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentContracts.map(c => (
                <tr key={c.id}>
                  <td className="font-bold text-blue-600">
                    <Link href={`/dashboard/contracts/${c.id}`}>{c.contractCode}</Link>
                  </td>
                  <td className="font-medium">{c.customer.fullName}</td>
                  <td className="text-slate-500 text-sm">{c.customer.phone ?? '--'}</td>
                  <td>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{c.assetType}</span>
                  </td>
                  <td className="font-bold">{formatCurrency(c.pawningAmount)}</td>
                  <td className="text-sm">{formatDate(c.startDate)}</td>
                  <td>
                    <span className={STATUS_CLS[c.status] || 'status-badge'}>
                      {STATUS_LBL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/contracts/${c.id}`} className="btn btn-ghost btn-sm">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
              {recentContracts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Chưa có hợp đồng nào.{' '}
                    <Link href="/dashboard/contracts/creation" className="text-blue-600 underline">
                      Tạo hợp đồng đầu tiên →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
