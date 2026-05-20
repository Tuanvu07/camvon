'use client';

import { useState } from 'react';
import { Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { lookupContract } from '@/actions/lookupContract';
import SubmitButton from '@/components/SubmitButton';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerPortal() {
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (formData: FormData) => {
    setError(null);
    setResult(null);
    const res = await lookupContract(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setResult(res.contracts);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Tra Cứu Khoản Vay</h1>
          <p className="text-slate-500 mt-2 text-lg">Cổng thông tin tự động dành cho khách hàng</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-6 sm:p-10 border border-slate-100">
          <form action={handleLookup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Số Điện Thoại</label>
              <input 
                name="phone" 
                type="tel" 
                required 
                placeholder="Nhập số điện thoại đã đăng ký..."
                className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Số CCCD / CMND</label>
              <input 
                name="cccd" 
                type="text" 
                required 
                placeholder="Nhập số căn cước..."
                className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <div className="pt-2">
              <SubmitButton 
                text="TRA CỨU NGAY"
                className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              />
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 pt-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Thông tin được bảo mật và mã hóa chuẩn ngân hàng
            </div>
          </form>
        </div>

        {result && result.length > 0 && (
          <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2 px-2">
              <Info size={20} className="text-blue-500" />
              Kết quả tra cứu ({result.length} hợp đồng)
            </h2>
            {result.map((contract, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${contract.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Mã hợp đồng</div>
                    <div className="font-black text-xl text-slate-800">{contract.contractCode}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {contract.status === 'ACTIVE' ? 'ĐANG CẦM' : 'ĐẾN HẠN LÃI'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Tài sản:</span>
                    <span className="font-bold text-slate-800 text-right max-w-[60%] truncate">{contract.assetName || 'Tài sản thế chấp'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Ngày đến hạn:</span>
                    <span className="font-black text-red-600 text-lg">{formatDate(new Date(contract.interestDueDate))}</span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 mt-2 space-y-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold text-sm">Dư nợ gốc:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(contract.pawningAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold text-sm">Lãi phí cần đóng:</span>
                      <span className="font-black text-blue-600 text-xl">{formatCurrency(contract.interestAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center text-sm font-medium text-slate-400 mt-8 pb-10 px-6">
              Vui lòng đến trực tiếp cửa hàng hoặc liên hệ qua Zalo OA để thực hiện thanh toán gia hạn.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
