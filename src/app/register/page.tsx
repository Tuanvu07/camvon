'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, User, Mail, Lock, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { registerTenant } from '@/actions/registerTenant';
import SubmitButton from '@/components/SubmitButton';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const res = await registerTenant(formData);
    
    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(res.redirect || '/login');
      }, 2500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-10 max-w-md w-full text-center border border-slate-700/50 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <CheckCircle size={80} className="text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
          <h2 className="text-3xl font-black text-white mb-3">Tạo Thành Công!</h2>
          <p className="text-slate-300 font-medium">Hệ thống đang chuẩn bị vùng dữ liệu (Tenant) riêng biệt cho cửa hàng của bạn. Tự động chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <ShieldCheck size={36} className="text-blue-500" /> LendOS
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Khởi tạo hệ thống cầm đồ của riêng bạn</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-400 to-blue-600"></div>
          
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Store size={16} className="text-blue-400" /> Tên Tiệm Cầm Đồ
              </label>
              <input 
                name="shopName" 
                type="text" 
                required 
                placeholder="VD: Cầm Đồ Phát Đạt"
                className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <User size={16} className="text-emerald-400" /> Tên Chủ Tiệm
              </label>
              <input 
                name="ownerName" 
                type="text" 
                required 
                placeholder="Họ và tên của bạn"
                className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-500 font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Mail size={16} className="text-amber-400" /> Email Đăng Nhập
              </label>
              <input 
                name="email" 
                type="email" 
                required 
                placeholder="email@example.com"
                className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-600 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Lock size={16} className="text-red-400" /> Mật khẩu
              </label>
              <input 
                name="password" 
                type="password" 
                required 
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
                className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-600 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-slate-500 font-medium"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 text-red-400 p-4 rounded-xl text-sm font-semibold flex items-start gap-2 border border-red-900/50 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4">
              <SubmitButton 
                text="🚀 Bắt đầu 14 ngày dùng thử miễn phí"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-[15px] hover:from-blue-500 hover:to-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center border border-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
              />
            </div>
            
            <div className="flex justify-center items-center gap-2 text-xs font-semibold text-slate-400 pt-3">
              <ShieldCheck size={14} className="text-emerald-400" />
              Không cần thẻ tín dụng • Hủy bất kỳ lúc nào
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-slate-400 font-medium text-sm">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 transition-colors">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}
