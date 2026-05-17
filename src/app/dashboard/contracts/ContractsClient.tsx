'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Download, FileText, Clock,
  AlertTriangle, TrendingDown, Skull, Eye, Printer, Trash2
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatInterestRate, CONTRACT_STATUS_LABELS } from '@/lib/utils';
import { calcAccruedInterest, overdueDays } from '@/lib/math';
import type { RateType, InterestCycle, ContractStatus } from '@/types';
import QuickCollectionModal from '@/components/QuickCollectionModal';

type ContractRow = {
  id: string; shopId: string; contractCode: string;
  customerId: string; assetType: string; assetBrand?: string|null;
  assetModel?: string|null; assetPlate?: string|null; assetImei?: string|null;
  pawningAmount: number; interestRateType: string; interestRateValue: number;
  interestCycle: string; startDate: string; interestDueDate?: string|null;
  status: string; totalInterestPaid: number;
  customer: { fullName: string; phone?: string|null; cccdNumber?: string|null };
};

const STATUS_TABS = [
  { key: 'ALL',                 label: 'Tất cả',        color: 'bg-slate-600' },
  { key: 'ACTIVE',              label: 'Đang cầm',      color: 'bg-emerald-500' },
  { key: 'INTEREST_DUE',        label: 'Chậm lãi phí',  color: 'bg-amber-500' },
  { key: 'PENDING_LIQUIDATION', label: 'Chờ thanh lý',  color: 'bg-orange-500' },
  { key: 'OLD_DEBT',            label: 'Nợ cũ',         color: 'bg-red-400' },
  { key: 'BAD_DEBT',            label: 'Nợ xấu',        color: 'bg-red-700' },
];

const STAT_CARDS = [
  { key: 'ACTIVE',              label: 'Đang cầm',      icon: <FileText size={22} />, cls: 'stat-card-blue' },
  { key: 'INTEREST_DUE',        label: 'Đến hạn lãi',   icon: <Clock size={22} />,    cls: 'stat-card-amber' },
  { key: 'PENDING_LIQUIDATION', label: 'Chờ thanh lý',  icon: <AlertTriangle size={22} />, cls: 'stat-card-orange' },
  { key: 'OLD_DEBT',            label: 'Nợ cũ',         icon: <TrendingDown size={22} />,  cls: 'stat-card-red' },
  { key: 'BAD_DEBT',            label: 'Nợ xấu',        icon: <Skull size={22} />,    cls: 'stat-card-rose' },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'status-badge status-active',
  INTEREST_DUE: 'status-badge status-due',
  PENDING_LIQUIDATION: 'status-badge status-pending',
  LIQUIDATED: 'status-badge status-liquidated',
  REDEEMED: 'status-badge status-redeemed',
  OLD_DEBT: 'status-badge status-old-debt',
  BAD_DEBT: 'status-badge status-bad-debt',
};

const STATUS_LBL: Record<string, string> = {
  ACTIVE: 'Đang cầm', INTEREST_DUE: 'Chậm lãi phí',
  PENDING_LIQUIDATION: 'Chờ TL', LIQUIDATED: 'Đã TL',
  REDEEMED: 'Đã chuộc', OLD_DEBT: 'Nợ cũ', BAD_DEBT: 'Nợ xấu',
};

export default function ContractsClient({ contracts, shopId }: { contracts: ContractRow[]; shopId: string }) {
  const [tab, setTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = { ALL: contracts.length };
    for (const s of ['ACTIVE','INTEREST_DUE','PENDING_LIQUIDATION','OLD_DEBT','BAD_DEBT']) {
      c[s] = contracts.filter(x => x.status === s).length;
    }
    return c;
  }, [contracts]);

  const filtered = useMemo(() => {
    let list = contracts;
    if (tab !== 'ALL') list = list.filter(c => c.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.contractCode.toLowerCase().includes(q) ||
        c.customer?.fullName.toLowerCase().includes(q) ||
        (c.customer?.phone ?? '').includes(q) ||
        (c.assetPlate ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [contracts, tab, search]);

  const totalPawned = filtered.reduce((s, c) => s + c.pawningAmount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Quản lý hợp đồng</h1>
          <p className="page-subtitle">Tổng cộng {contracts.length} hợp đồng • {formatDate(new Date())}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm"><Download size={15} /> Xuất Excel</button>
          <Link href="/dashboard/contracts/creation" className="btn btn-primary">
            <Plus size={18} /> Cầm đồ mới
          </Link>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
        {STAT_CARDS.map(card => (
          <button key={card.key} onClick={() => setTab(card.key)}
            className={cn('stat-card text-left w-full', card.cls, tab === card.key && 'ring-4 ring-white/40 scale-[1.02]')}>
            <div className="mb-2 opacity-80">{card.icon}</div>
            <div className="text-3xl font-black">{counts[card.key] ?? 0}</div>
            <div className="text-xs font-semibold opacity-90 mt-1">{card.label}</div>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  tab === t.key ? `${t.color} text-white shadow-sm` : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {t.label} <span className="ml-1 text-xs opacity-80">({counts[t.key] ?? 0})</span>
              </button>
            ))}
            <div className="relative flex-1 min-w-[200px]">
              <input id="contract-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm mã HĐ, tên KH, số ĐT, biển số..." className="input pl-9 py-2 text-sm" />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead>
              <tr>
                <th>#</th><th>Mã HĐ</th><th>Khách hàng</th><th>SĐT</th>
                <th>Loại</th><th>Tài sản</th><th>Tiền cầm</th><th>Lãi suất</th>
                <th>Ngày cầm</th><th>Lãi đến HN</th><th>Tình trạng</th>
                <th>Đóng lãi</th><th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-12 text-slate-400">
                  <FileText size={36} className="mx-auto mb-2 opacity-20" />
                  <div>Không có hợp đồng nào</div>
                </td></tr>
              ) : filtered.map((c, idx) => {
                const accrued = calcAccruedInterest(
                  c.pawningAmount, c.interestRateType as any, c.interestRateValue,
                  c.interestCycle as any, new Date(c.startDate)
                );
                const od = overdueDays(c.interestDueDate ? new Date(c.interestDueDate) : null);
                return (
                  <tr key={c.id} className="group">
                    <td className="text-slate-400 text-xs">{idx + 1}</td>
                    <td><Link href={`/dashboard/contracts/${c.id}`} className="font-bold text-blue-600 hover:underline">{c.contractCode}</Link></td>
                    <td>
                      <div className="font-semibold text-slate-800 leading-tight">{c.customer?.fullName}</div>
                      {c.customer?.cccdNumber && <div className="text-xs text-slate-400">{c.customer.cccdNumber}</div>}
                    </td>
                    <td className="text-slate-600 text-sm">{c.customer?.phone ?? '--'}</td>
                    <td><span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">{c.assetType}</span></td>
                    <td>
                      <div className="text-sm font-medium leading-tight">{[c.assetBrand, c.assetModel].filter(Boolean).join(' ') || '--'}</div>
                      {c.assetPlate && <div className="text-xs text-blue-600 font-bold">{c.assetPlate}</div>}
                    </td>
                    <td className="font-bold whitespace-nowrap">{formatCurrency(c.pawningAmount)}</td>
                    <td className="text-sm whitespace-nowrap">{formatInterestRate(c.interestRateType as any, c.interestRateValue, c.interestCycle as any)}</td>
                    <td className="text-sm text-slate-600 whitespace-nowrap">{formatDate(new Date(c.startDate))}</td>
                    <td className="font-bold text-right whitespace-nowrap">
                      {accrued > 0 ? <span className="text-orange-600">{formatCurrency(accrued)}</span> : <span className="text-slate-400">0</span>}
                      {od > 0 && <div className="text-xs text-red-500">({od} ngày)</div>}
                    </td>
                    <td><span className={STATUS_BADGE[c.status] || 'status-badge'}>{STATUS_LBL[c.status] ?? c.status}</span></td>
                    <td className="text-sm whitespace-nowrap">
                      {c.interestDueDate ? <span className={cn('font-medium', od > 0 ? 'text-red-600' : 'text-slate-600')}>{formatDate(new Date(c.interestDueDate))}</span> : '--'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedContract(c)}
                          className="btn-icon text-emerald-600 hover:bg-emerald-50" 
                          title="Thu tiền nhanh"
                        >
                          💰
                        </button>
                        <Link href={`/dashboard/contracts/${c.id}`} className="btn-icon text-blue-600 hover:bg-blue-50" title="Xem"><Eye size={14} /></Link>
                        <button className="btn-icon text-slate-500 hover:bg-slate-100" title="In bill"><Printer size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Hiển thị <strong>{filtered.length}</strong> / {contracts.length}</span>
          <span>Tổng vốn: <strong className="text-slate-800">{formatCurrency(totalPawned)}</strong></span>
        </div>
      </div>

      {/* Quick Collection Modal */}
      {selectedContract && (
        <QuickCollectionModal 
          contract={selectedContract} 
          onClose={() => setSelectedContract(null)} 
          onSuccess={() => setSelectedContract(null)} 
        />
      )}
    </div>
  );
}
