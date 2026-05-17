'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowRight, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type MigrationResult = {
  total: number;
  success: number;
  skipped: number;
  errors: { row: number; code: string; reason: string }[];
};

const EXPECTED_COLUMNS = ['Mã HĐ','Tên KH','SĐT','Tiền vay','Lãi Phí','Ngày vay','Đồ cầm','CMND'];

export default function MigrationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
      setResult(null);
      setError('');
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/migration/1gold', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? 'Upload failed');
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const successRate = result ? Math.round((result.success / result.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          ⚡ 1-CLICK DATA MIGRATION
        </div>
        <h1 className="page-title text-2xl">Nhập dữ liệu từ 1Gold</h1>
        <p className="page-subtitle">Chuyển đổi toàn bộ dữ liệu hợp đồng cũ sang LendOS trong vài giây</p>
      </div>

      {/* Instructions */}
      <div className="card border-blue-200 bg-blue-50/50">
        <div className="card-body py-4">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-600" /> Hướng dẫn xuất file từ 1Gold
          </h3>
          <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>Đăng nhập 1gold.biz → Cầm đồ → Danh sách hợp đồng</li>
            <li>Nhấn nút <strong>"Xuất Excel"</strong> ở góc trên bên phải</li>
            <li>Lưu file .xlsx hoặc export dạng CSV (UTF-8)</li>
            <li>Upload file vào đây → Nhấn <strong>"Nhập dữ liệu"</strong></li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXPECTED_COLUMNS.map(col => (
              <span key={col} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">{col}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
            dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
            file ? 'border-emerald-400 bg-emerald-50' : ''
          )}
          style={{ borderWidth: '2px' }}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />
          {file ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto">
                <FileSpreadsheet size={28} className="text-emerald-600" />
              </div>
              <div className="font-bold text-emerald-700 text-lg">{file.name}</div>
              <div className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB • Sẵn sàng nhập</div>
              <button onClick={e => { e.stopPropagation(); setFile(null); }}
                className="text-slate-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 mx-auto">
                <X size={12} /> Chọn file khác
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                <Upload size={28} className="text-slate-400" />
              </div>
              <div>
                <div className="font-bold text-slate-700 text-lg">Kéo & Thả file vào đây</div>
                <div className="text-slate-500 text-sm mt-1">hoặc nhấn để chọn file</div>
              </div>
              <div className="text-xs text-slate-400">Hỗ trợ: .CSV, .XLSX (UTF-8) • Tối đa 10MB</div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div><strong>Lỗi:</strong> {error}</div>
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button onClick={handleUpload} disabled={loading} className="btn btn-success btn-lg w-full">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
          {loading ? 'Đang xử lý...' : `Nhập ${file.name}`}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card card-body text-center">
              <div className="text-3xl font-black text-slate-800">{result.total}</div>
              <div className="text-sm text-slate-500 mt-1">Tổng dòng</div>
            </div>
            <div className="card card-body text-center border-emerald-200">
              <div className="text-3xl font-black text-emerald-600">{result.success}</div>
              <div className="text-sm text-emerald-600 mt-1">✅ Nhập thành công</div>
            </div>
            <div className="card card-body text-center border-amber-200">
              <div className="text-3xl font-black text-amber-600">{result.skipped}</div>
              <div className="text-sm text-amber-600 mt-1">⚠️ Bỏ qua</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card card-body">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span>Tỷ lệ thành công</span>
              <span className="text-emerald-600">{successRate}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${successRate}%` }} />
            </div>
          </div>

          {/* Errors table */}
          {result.errors.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header bg-amber-50">
                <h3 className="font-bold text-amber-700 flex items-center gap-2">
                  <AlertTriangle size={16} /> {result.errors.length} dòng lỗi (không ảnh hưởng dữ liệu khác)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="lendos-table">
                  <thead><tr><th>Dòng</th><th>Mã HĐ</th><th>Lý do lỗi</th></tr></thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="text-slate-400">{e.row}</td>
                        <td className="font-bold text-slate-700">{e.code}</td>
                        <td className="text-red-600 text-sm">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <a href="/dashboard/contracts" className="btn btn-primary flex-1">
              <CheckCircle size={18} /> Xem danh sách hợp đồng vừa nhập
            </a>
            <button onClick={() => { setResult(null); setFile(null); }} className="btn btn-outline">
              Nhập thêm file khác
            </button>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠️ Lưu ý:</strong> Hệ thống sẽ tự động bỏ qua các hợp đồng đã tồn tại (trùng Mã HĐ).
        Khách hàng mới sẽ được tạo tự động. Dữ liệu hoàn toàn cô lập với các cửa hàng khác.
      </div>
    </div>
  );
}
