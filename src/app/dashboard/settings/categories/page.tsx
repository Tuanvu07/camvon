'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Xe máy', code: 'XM', rate: '3k /1triệu/ngày', cycle: '10 ngày', liquidAfter: '5 ngày quá hạn', status: 'Bình thường' },
  { id: '2', name: 'Ô tô',   code: 'OTO', rate: '3k /1triệu/ngày', cycle: '10 ngày', liquidAfter: '5 ngày quá hạn', status: 'Bình thường' },
  { id: '3', name: 'Điện thoại', code: 'ĐT', rate: '3k /1triệu/ngày', cycle: '10 ngày', liquidAfter: '5 ngày quá hạn', status: 'Bình thường' },
  { id: '4', name: 'Laptop', code: 'LT', rate: '3k /1triệu/ngày', cycle: '10 ngày', liquidAfter: '5 ngày quá hạn', status: 'Bình thường' },
  { id: '5', name: 'Vàng',   code: 'Vang', rate: '3k /1triệu/ngày', cycle: '10 ngày', liquidAfter: '5 ngày quá hạn', status: 'Bình thường' },
  { id: '6', name: 'GT',     code: 'GT', rate: '0k /1triệu/ngày', cycle: '0 ngày', liquidAfter: '7 ngày quá hạn', status: 'Bình thường' },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [field, setField] = useState('all');
  const [status, setStatus] = useState('all');

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Cấu hình hàng hóa</h1>
        <p className="page-subtitle">Danh mục tài sản và lãi suất mặc định</p>
      </div>

      <div className="card">
        <div className="card-body py-3 flex gap-3 flex-wrap items-end">
          <div className="input-group">
            <label className="input-label">Tên hàng hóa</label>
            <input id="cat-search" value={search} onChange={e => setSearch(e.target.value)} className="input py-2 w-44" placeholder="Tên hàng..." />
          </div>
          <div className="input-group">
            <label className="input-label">Lĩnh vực</label>
            <select id="field-filter" value={field} onChange={e => setField(e.target.value)} className="select py-2 w-36">
              <option value="all">Tất cả</option>
              <option value="camdo">Cầm đồ</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Trạng thái</label>
            <select id="status-filter" value={status} onChange={e => setStatus(e.target.value)} className="select py-2 w-36">
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
            </select>
          </div>
          <button className="btn-primary btn-sm">
            <Search size={15} /> Tìm kiếm
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <button className="btn-success btn-sm"><Plus size={15} /> Thêm mới</button>
        </div>
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead>
              <tr>
                <th>#</th><th>Lĩnh vực</th><th>Tên</th><th>Mã</th>
                <th>Tiền cầm</th><th>Lãi phí</th><th>Kỳ lãi phí</th>
                <th>Thanh lý sau</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_CATEGORIES.map((cat, i) => (
                <tr key={cat.id}>
                  <td className="text-slate-400">{i + 1}</td>
                  <td className="text-sm text-slate-600">Cầm đồ</td>
                  <td className="font-bold text-blue-600">{cat.name}</td>
                  <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-700">{cat.code}</span></td>
                  <td className="text-slate-600">0</td>
                  <td className="text-sm text-slate-700">{cat.rate}</td>
                  <td className="text-sm text-slate-700">{cat.cycle}</td>
                  <td className="text-sm text-slate-700">{cat.liquidAfter}</td>
                  <td>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md">
                      {cat.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-icon text-blue-500 hover:bg-blue-50"><Pencil size={13} /></button>
                      <button className="btn-icon text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
