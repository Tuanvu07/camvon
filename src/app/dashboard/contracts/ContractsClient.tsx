'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Eye, Printer, MessageSquare
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatInterestRate } from '@/lib/utils';
import { calcAccruedInterest, overdueDays } from '@/lib/math';
import QuickCollectionModal from '@/components/QuickCollectionModal';
import { sendManualReminder } from '@/actions/sendManualReminder';
import { renewContract } from '@/actions/renewContract';
import { payPartialPrincipal } from '@/actions/payPartialPrincipal';
import SubmitButton from '@/components/SubmitButton';

export type ContractRow = {
  id: string; shopId: string; contractCode: string;
  customerId: string; assetType: string; assetBrand?: string|null;
  assetModel?: string|null; assetPlate?: string|null; assetImei?: string|null;
  pawningAmount: number; interestRateType: string; interestRateValue: number;
  interestCycle: string; startDate: string; interestDueDate?: string|null;
  status: string; totalInterestPaid: number;
  customer: { fullName: string; phone?: string|null; cccdNumber?: string|null };
};

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

export default function ContractsClient({ contracts, totalCount, totalPawned }: { contracts: ContractRow[]; shopId: string; totalCount: number; totalPawned: number }) {
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [partialPayContract, setPartialPayContract] = useState<ContractRow | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Table */}
      <div className="card overflow-hidden shadow-xl border-slate-200">
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4">#</th><th className="py-4">Mã HĐ</th><th className="py-4">Khách hàng</th><th className="py-4">SĐT</th>
                <th className="py-4">Loại</th><th className="py-4">Tài sản</th><th className="py-4 text-right">Tiền cầm</th><th className="py-4">Lãi suất</th>
                <th className="py-4">Ngày cầm</th><th className="py-4 text-right">Lãi đến HN</th><th className="py-4">Tình trạng</th>
                <th className="py-4">Đóng lãi</th><th className="text-center py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-16 text-slate-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-20 text-slate-500" />
                  <div className="text-lg font-bold text-slate-500">Không tìm thấy hợp đồng nào phù hợp</div>
                </td></tr>
              ) : contracts.map((c, idx) => {
                const accrued = calcAccruedInterest(
                  c.pawningAmount, c.interestRateType as any, c.interestRateValue,
                  c.interestCycle as any, new Date(c.startDate)
                );
                const od = overdueDays(c.interestDueDate ? new Date(c.interestDueDate) : null);
                return (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="text-slate-400 text-sm font-bold">{idx + 1}</td>
                    <td><Link href={`/dashboard/contracts/${c.id}`} className="font-black text-blue-600 hover:text-blue-800 hover:underline">{c.contractCode}</Link></td>
                    <td>
                      <div className="font-black text-slate-800 text-[15px]">{c.customer?.fullName}</div>
                      {c.customer?.cccdNumber && <div className="text-xs text-slate-500 font-medium">{c.customer.cccdNumber}</div>}
                    </td>
                    <td className="text-slate-600 font-bold text-[15px]">{c.customer?.phone ?? '--'}</td>
                    <td><span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg border border-slate-200">{c.assetType}</span></td>
                    <td>
                      <div className="text-[15px] font-bold text-slate-800">{[c.assetBrand, c.assetModel].filter(Boolean).join(' ') || '--'}</div>
                      {c.assetPlate && <div className="text-xs text-blue-600 font-black tracking-wider uppercase bg-blue-50 inline-block px-1.5 py-0.5 rounded mt-1">{c.assetPlate}</div>}
                    </td>
                    <td className="font-black text-[15px] text-right text-slate-800 whitespace-nowrap">{formatCurrency(c.pawningAmount)}</td>
                    <td className="text-sm font-bold text-slate-600 whitespace-nowrap">{formatInterestRate(c.interestRateType as any, c.interestRateValue, c.interestCycle as any)}</td>
                    <td className="text-[15px] font-semibold text-slate-600 whitespace-nowrap">{formatDate(new Date(c.startDate))}</td>
                    <td className="font-black text-right whitespace-nowrap">
                      {accrued > 0 ? <span className="text-orange-600 text-[15px]">{formatCurrency(accrued)}</span> : <span className="text-slate-400">0</span>}
                      {od > 0 && <div className="text-xs text-red-500 bg-red-50 inline-block px-1.5 rounded-full mt-1">Trễ {od} ngày</div>}
                    </td>
                    <td><span className={STATUS_BADGE[c.status] || 'status-badge'}>{STATUS_LBL[c.status] ?? c.status}</span></td>
                    <td className="text-[15px] whitespace-nowrap">
                      {c.interestDueDate ? <span className={cn('font-black', od > 0 ? 'text-red-600' : 'text-slate-700')}>{formatDate(new Date(c.interestDueDate))}</span> : '--'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(c.status === 'INTEREST_DUE' || c.status === 'BAD_DEBT') && (
                          <form action={async (formData) => { 
                            const res = await sendManualReminder(formData);
                            if (res.error) alert(res.error);
                            else alert('Đã gửi tin nhắn nhắc nợ thành công!');
                          }} className="inline m-0 p-0">
                            <input type="hidden" name="contractId" value={c.id} />
                            <button type="submit" className="btn-icon text-orange-500 hover:bg-orange-100 border border-transparent hover:border-orange-200 bg-orange-50/50" title="Nhắn tin nhắc nợ">
                              <MessageSquare size={16} />
                            </button>
                          </form>
                        )}
                        
                        <form action={async (formData) => { 
                          const res = await renewContract(formData);
                          if (res.error) alert(res.error);
                          else alert('Đã thu lãi và gia hạn thành công!');
                        }} className="inline m-0 p-0">
                          <input type="hidden" name="contractId" value={c.id} />
                          <SubmitButton text="Thu Lãi" className="px-3 py-1.5 text-xs font-black rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-sm transition-transform active:scale-95" />
                        </form>
                        
                        <button 
                          onClick={() => setPartialPayContract(c)}
                          className="px-3 py-1.5 text-xs font-black rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 border border-teal-200 shadow-sm transition-transform active:scale-95" 
                          title="Trả bớt gốc"
                        >
                          Rút Gốc
                        </button>
                        
                        <button 
                          onClick={() => setSelectedContract(c)}
                          className="px-3 py-1.5 text-xs font-black rounded-lg bg-slate-800 text-white hover:bg-slate-700 shadow-sm transition-transform active:scale-95" 
                          title="Tất toán hợp đồng"
                        >
                          Chuộc Đồ
                        </button>

                        <Link href={`/dashboard/contracts/${c.id}`} className="btn-icon text-blue-600 hover:bg-blue-100 border border-transparent hover:border-blue-200 bg-blue-50/50" title="Xem Chi Tiết">
                          <Eye size={16} />
                        </Link>
                        <button className="btn-icon text-slate-500 hover:bg-slate-200 bg-slate-100" title="In Biên Lai">
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[15px] font-bold text-slate-600">
          <span>Kết quả: <strong className="text-blue-600 text-lg">{contracts.length}</strong> / {totalCount} hợp đồng</span>
          <span>Dư nợ trên trang: <strong className="text-red-600 text-xl font-black">{formatCurrency(totalPawned)}</strong></span>
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

      {/* Partial Pay Modal */}
      {partialPayContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
              <h3 className="text-xl font-black text-teal-800">Trả Bớt Nợ Gốc</h3>
              <button onClick={() => setPartialPayContract(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors">✕</button>
            </div>
            <form action={async (formData) => {
              const res = await payPartialPrincipal(formData);
              if (res.error) alert(res.error);
              else {
                alert('Đã thu bớt gốc thành công!');
                setPartialPayContract(null);
              }
            }} className="p-6 space-y-6">
              <input type="hidden" name="contractId" value={partialPayContract.id} />
              
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-200 shadow-inner">
                <div className="text-sm font-bold text-slate-500 mb-1">Dư nợ gốc hiện tại:</div>
                <div className="text-3xl font-black text-red-600">{formatCurrency(partialPayContract.pawningAmount)}</div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-700 mb-3 block text-center">Khách hàng muốn trả bớt bao nhiêu?</label>
                <input 
                  type="text" 
                  name="amount" 
                  autoFocus
                  required
                  placeholder="Ví dụ: 5,000,000"
                  className="w-full text-center text-4xl font-black text-teal-600 bg-white border-2 border-slate-200 rounded-2xl py-4 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all shadow-inner"
                  onInput={(e) => {
                    let val = e.currentTarget.value.replace(/[^0-9]/g, '');
                    if (val) {
                      e.currentTarget.value = new Intl.NumberFormat('vi-VN').format(Number(val));
                    }
                  }}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setPartialPayContract(null)} className="flex-1 py-4 text-slate-600 font-black text-lg bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all border border-slate-200 shadow-sm">Hủy Bỏ</button>
                <div className="flex-[2]">
                  <SubmitButton text="XÁC NHẬN THU GỐC" className="w-full py-4 text-white font-black bg-teal-600 hover:bg-teal-700 rounded-2xl transition-all shadow-lg shadow-teal-600/30 text-lg border border-teal-500" />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
