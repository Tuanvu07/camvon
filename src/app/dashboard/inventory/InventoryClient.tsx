'use client';

import { useState } from 'react';
import { Search, Tag, MapPin, PackageOpen } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryClient({ contracts }: { contracts: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = contracts.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.assetName || '').toLowerCase().includes(q) ||
      (c.assetPlate || '').toLowerCase().includes(q) ||
      (c.contractCode || '').toLowerCase().includes(q) ||
      (c.customer?.fullName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Thanh tìm kiếm Poka-yoke */}
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Gõ tên xe, biển số, mã HĐ hoặc tên khách hàng để tìm nhanh tài sản..."
          className="w-full bg-white border-4 border-slate-200 rounded-3xl py-6 px-16 text-2xl font-black text-slate-800 focus:outline-none focus:border-blue-500 transition-colors shadow-sm group-hover:shadow-md"
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-8 h-8 group-focus-within:text-blue-500 transition-colors" />
      </div>

      {/* Kết quả đếm */}
      <div className="flex items-center gap-2 text-slate-600 font-bold text-lg">
        <PackageOpen size={24} className="text-blue-500" />
        Đang lưu trữ {filtered.length} tài sản trong kho.
      </div>

      {/* Lưới tài sản */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(contract => (
          <Link href={`/dashboard/contracts/${contract.id}`} key={contract.id} className="card p-6 border-2 border-slate-200 hover:border-blue-500 transition-all hover:shadow-xl group flex flex-col justify-between cursor-pointer bg-white">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg group-hover:bg-blue-50 transition-colors">{contract.contractCode}</span>
                <span className={`font-bold px-3 py-1 rounded-lg ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                  {contract.status === 'ACTIVE' ? 'Đang Cầm' : 'Chờ Thanh Lý'}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                {contract.assetName || 'Tài sản không xác định'}
              </h3>
              
              <div className="flex items-center gap-3 text-slate-700 font-bold mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Tag size={24} className="text-blue-500 shrink-0" /> 
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-500 font-medium">Biển số / IMEI</div>
                  <div className="text-blue-700 text-xl truncate">{contract.assetPlate || '--'}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-slate-500 text-sm font-medium">Khách hàng</p>
                <p className="font-bold text-slate-700 truncate max-w-[150px]">{contract.customer?.fullName || 'Không rõ'}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">Tiền cầm</p>
                <p className="font-black text-emerald-600 text-xl">{formatCurrency(contract.pawningAmount)}</p>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <div className="w-24 h-24 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-700 mb-2">Không tìm thấy tài sản</h3>
            <p className="text-slate-500 text-xl font-medium">
              Không có tài sản nào khớp với từ khóa "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
