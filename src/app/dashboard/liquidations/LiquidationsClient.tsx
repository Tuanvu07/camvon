'use client';
import { useState } from 'react';
import { liquidateContract } from '@/actions/liquidateContract';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, DollarSign, CheckCircle } from 'lucide-react';

export default function LiquidationsClient({ pending, done }: { pending: any[], done: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-orange-600 mb-6 flex items-center gap-3"><AlertTriangle size={32}/> TÀI SẢN CHỜ THANH LÝ ({pending.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {pending.map(c => (
            <div key={c.id} className="card p-6 border-4 border-orange-200 bg-orange-50/50 shadow-xl shadow-orange-500/10">
              <div className="font-bold text-slate-500 mb-2 flex justify-between">
                <span>{c.contractCode}</span>
                <span>KH: {c.customer.fullName}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">{c.assetName || 'Không có tên'}</h3>
              <div className="text-orange-800 font-black bg-orange-100 p-4 rounded-xl mb-4 text-xl border border-orange-200">Biển số/IMEI: {c.assetPlate || '--'}</div>
              <p className="text-slate-600 font-bold mb-6 text-lg">Gốc cho vay: <span className="text-red-600 font-black">{formatCurrency(c.pawningAmount)}</span></p>
              
              <form action={async (formData) => { setLoadingId(c.id); await liquidateContract(formData); }} className="flex flex-col gap-3 border-t border-dashed border-orange-300 pt-4">
                <input type="hidden" name="contractId" value={c.id} />
                <label className="font-bold text-slate-700">Nhập giá bán thực tế:</label>
                <div className="relative">
                  <input type="number" required name="amount" placeholder="Ví dụ: 5000000" className="w-full border-2 border-slate-300 rounded-xl py-4 pl-4 pr-12 font-black text-2xl text-slate-800 focus:border-orange-500 outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">đ</span>
                </div>
                <button type="submit" disabled={loadingId === c.id} className="w-full btn bg-orange-600 hover:bg-orange-700 text-white font-black py-5 text-xl flex items-center justify-center gap-2 rounded-xl mt-2 shadow-xl active:scale-[0.98] transition-transform">
                  <DollarSign size={24} /> {loadingId === c.id ? 'ĐANG BÁN...' : 'XÁC NHẬN BÁN THANH LÝ'}
                </button>
              </form>
            </div>
          ))}
          {pending.length === 0 && <div className="col-span-full py-12 text-center text-xl font-bold text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">Không có tài sản nào đang chờ thanh lý.</div>}
        </div>
      </div>

      <div className="pt-8 border-t-4 border-slate-100">
        <h2 className="text-3xl font-black text-emerald-600 mb-6 flex items-center gap-3"><CheckCircle size={32}/> TÀI SẢN ĐÃ THANH LÝ XONG ({done.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {done.map(c => (
            <div key={c.id} className="card p-5 border-2 border-emerald-200 bg-emerald-50/50 opacity-70 hover:opacity-100 transition-opacity">
              <div className="font-bold text-slate-500 mb-1">{c.contractCode}</div>
              <h3 className="text-xl font-black text-slate-800 mb-2 line-through decoration-slate-400 decoration-2">{c.assetName || 'Không có tên'}</h3>
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg text-sm">Đã thu hồi vốn</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
