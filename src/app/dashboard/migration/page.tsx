'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Rocket, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MigrationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleMigration = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/migration/1gold', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Quá trình import gặp lỗi từ Server.');
      }
      
      setSuccess(true);
      // Giả định API trả về migratedCount hoặc count
      setSuccessCount(data.migratedCount || data.count || data.successCount || 0);
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng hoặc lỗi parse file dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 animate-fade-in text-center">
        <div className="bg-emerald-50 border-4 border-emerald-200 rounded-[3rem] p-16 shadow-2xl">
          <div className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/30">
            <CheckCircle size={80} />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-emerald-800 mb-6 uppercase tracking-tight">
            Hút dữ liệu thành công hoàn toàn!
          </h1>
          <p className="text-2xl font-bold text-emerald-600 mb-12 leading-relaxed">
            Hệ thống đã nạp thành công <span className="text-4xl font-black text-emerald-700 bg-white px-4 py-2 rounded-xl border-2 border-emerald-200 shadow-sm mx-2">{successCount}</span> hợp đồng & khách hàng mới vào Database Cloud.
          </p>
          
          <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-2xl shadow-xl active:scale-95 transition-all">
            ĐI TỚI BẢNG ĐIỀU KHIỂN <ArrowRight size={28} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl lg:text-5xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center justify-center gap-4">
          <Rocket className="text-blue-600" size={48} /> Hệ Thống Di Chuyển Dữ Liệu
        </h1>
        <p className="text-xl font-bold text-slate-500 bg-slate-100 py-3 px-6 rounded-full inline-block">
          Migration Engine: Công cụ ẩn hỗ trợ đối soát và hút dữ liệu khổng lồ từ hệ thống 1gold.
        </p>
      </div>

      <div className="card p-10 lg:p-16 border-4 border-slate-200 shadow-2xl bg-white rounded-[2.5rem]">
        {error && (
          <div className="mb-8 bg-red-50 text-red-800 border-4 border-red-200 p-8 rounded-3xl flex items-start gap-4 shadow-lg shadow-red-500/10">
            <AlertTriangle className="shrink-0 mt-1" size={36} />
            <div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-wide">Import Thất Bại</h3>
              <p className="text-xl font-medium">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center border-4 border-dashed border-blue-200 bg-blue-50/50 rounded-[2.5rem]">
            <Loader2 size={100} className="mx-auto text-blue-600 animate-spin mb-10" />
            <h2 className="text-4xl font-black text-blue-800 mb-6 animate-pulse uppercase tracking-widest">Đang hút dữ liệu...</h2>
            <p className="text-2xl font-bold text-blue-600 max-w-3xl mx-auto px-6 leading-relaxed">
              Hệ thống đang bóc tách chuỗi tiền tệ và đồng bộ hàng ngàn hợp đồng vào Supabase Cloud... 
              <br/><br/>
              <span className="text-red-600 bg-red-100 border-2 border-red-200 px-6 py-3 rounded-xl inline-block uppercase font-black shadow-inner">
                Tuyệt đối không đóng trình duyệt lúc này!
              </span>
            </p>
          </div>
        ) : (
          <>
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-dashed border-[6px] rounded-[2.5rem] p-24 text-center cursor-pointer transition-all duration-300 ${file ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                className="hidden" 
              />
              
              {file ? (
                <div className="space-y-6 animate-fade-in">
                  <FileSpreadsheet size={120} className="mx-auto text-emerald-500 drop-shadow-xl" />
                  <h3 className="text-3xl font-black text-slate-800">Đã nhận diện tệp dữ liệu</h3>
                  <p className="text-2xl font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 py-4 px-8 rounded-full inline-block shadow-sm">
                    {file.name}
                  </p>
                  <p className="text-slate-500 font-bold text-xl mt-4">Kích thước: {(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <UploadCloud size={120} className="mx-auto text-slate-400" />
                  <h3 className="text-4xl font-black text-slate-700">Kéo thả tệp dữ liệu vào đây</h3>
                  <p className="text-2xl font-bold text-slate-500 mt-2">hoặc <span className="text-blue-600 font-black underline hover:text-blue-800 transition-colors">Bấm vào đây</span> để chọn file từ máy tính</p>
                  <p className="text-slate-400 font-bold text-lg pt-6">Chỉ hỗ trợ định dạng: .xlsx, .csv (Từ hệ thống 1gold cũ)</p>
                </div>
              )}
            </div>

            <div className="mt-12">
              <button 
                onClick={handleMigration}
                disabled={!file}
                className={`w-full py-8 rounded-[2rem] text-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl duration-300
                  ${file 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-1 active:scale-[0.98] cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }
                `}
              >
                <Rocket size={40} /> KÍCH HOẠT HÚT DỮ LIỆU
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
