'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, AlertCircle, Printer } from 'lucide-react';
import { formatCurrency, formatInterestRate } from '@/lib/utils';
import { calcInterestForCycle, calcRedemptionAmount } from '@/lib/math';
import { processCollection } from '@/actions/processCollection';
import PrintButton from '@/components/PrintButton';
import type { ContractRow } from '@/app/dashboard/contracts/ContractsClient'; // We will export this type or use any for now
import type { RateType, InterestCycle } from '@/types';

interface QuickCollectionModalProps {
  contract: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickCollectionModal({ contract, onClose, onSuccess }: QuickCollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Tính toán số tiền
  const interestOneCycle = calcInterestForCycle(
    contract.pawningAmount,
    contract.interestRateType as RateType,
    contract.interestRateValue,
    contract.interestCycle as InterestCycle
  );

  const interestTwoCycles = interestOneCycle * 2;

  const totalRedemption = calcRedemptionAmount(
    contract.pawningAmount,
    contract.interestRateType as RateType,
    contract.interestRateValue,
    contract.interestCycle as InterestCycle,
    new Date(contract.startDate),
    contract.totalInterestPaid
  );

  const handleProcess = async (type: 'INTEREST_COLLECT' | 'REDEEM_OUT', amount: number, cycles?: number) => {
    setLoading(true);
    setError('');
    
    const res = await processCollection({
      contractId: contract.id,
      amount,
      type,
      cyclesToPay: cycles,
      note: `Thu nhanh qua Poka-yoke UI`,
    });

    setLoading(false);
    
    if (res.error) {
      setError(res.error);
    } else {
      setSuccessData({
        typeLabel: type === 'INTEREST_COLLECT' ? `Thu lãi phí ${cycles || 1} kỳ` : 'Tất toán hợp đồng (chuộc đồ)',
        amount,
        transactionId: res.transactionId
      });
    }
  };

  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Thành công!</h2>
          <p className="text-slate-500 font-medium mb-6">Giao dịch đã được ghi nhận vào sổ quỹ.</p>
          
          <div className="bg-slate-50 p-4 rounded-xl mb-6">
            <div className="text-sm font-semibold text-slate-600 mb-1">{successData.typeLabel}</div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(successData.amount)}</div>
          </div>

          <div className="space-y-3">
            <PrintButton 
              showText 
              data={{
                shopName: 'Hệ thống Cầm Đồ', // Fallback, could pass from props
                transactionId: successData.transactionId,
                date: new Date(),
                typeLabel: successData.typeLabel,
                amount: successData.amount,
                contractCode: contract.contractCode,
                customerName: contract.customer?.fullName,
                staffName: 'Admin', // Fallback
                note: 'Thu nhanh qua Poka-yoke UI'
              }}
              className="w-full btn btn-primary"
            />
            <button onClick={onSuccess} className="w-full btn btn-outline">
              Đóng (Hoàn tất)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800">Thu tiền nhanh</h2>
            <div className="text-sm font-medium text-slate-500 mt-0.5">
              HĐ: <span className="text-blue-600">{contract.contractCode}</span> • {contract.customer?.fullName}
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold text-blue-800">Tiền cầm gốc</div>
              <div className="text-2xl font-black text-blue-700">{formatCurrency(contract.pawningAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-blue-800">Lãi phí</div>
              <div className="text-lg font-bold text-blue-700">
                {formatInterestRate(contract.interestRateType as RateType, contract.interestRateValue, contract.interestCycle as InterestCycle)}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Chạm để thu tiền (Không cần gõ phím)</h3>
            
            {/* Action Buttons - Elders First Design (Big & Clear) */}
            <button
              onClick={() => handleProcess('INTEREST_COLLECT', interestOneCycle, 1)}
              disabled={loading}
              className="w-full relative overflow-hidden group bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="text-left relative z-10">
                <div className="text-lg font-bold">Thu lãi 1 kỳ</div>
                <div className="text-emerald-100 text-sm mt-0.5">Cộng dồn ngày đóng lãi tiếp theo</div>
              </div>
              <div className="text-2xl font-black relative z-10">{formatCurrency(interestOneCycle)}</div>
            </button>

            <button
              onClick={() => handleProcess('INTEREST_COLLECT', interestTwoCycles, 2)}
              disabled={loading}
              className="w-full relative overflow-hidden group bg-teal-500 hover:bg-teal-600 text-white rounded-xl p-4 flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="text-left relative z-10">
                <div className="text-base font-bold">Thu lãi 2 kỳ</div>
              </div>
              <div className="text-xl font-black relative z-10">{formatCurrency(interestTwoCycles)}</div>
            </button>

            <div className="relative py-3 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Hoặc</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={() => handleProcess('REDEEM_OUT', totalRedemption)}
              disabled={loading}
              className="w-full relative overflow-hidden group bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="text-left relative z-10">
                <div className="text-lg font-bold">Tất toán (Chuộc đồ)</div>
                <div className="text-red-100 text-sm mt-0.5">Gốc + Lãi nợ đến hôm nay</div>
              </div>
              <div className="text-2xl font-black relative z-10">{formatCurrency(totalRedemption)}</div>
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <Loader2 size={40} className="text-blue-600 animate-spin mb-3" />
            <div className="font-bold text-slate-700">Đang xử lý giao dịch...</div>
          </div>
        )}
      </div>
    </div>
  );
}
