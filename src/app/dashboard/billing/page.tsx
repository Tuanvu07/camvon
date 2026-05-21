'use client';

import { useState } from 'react';
import { requestUpgrade } from '@/actions/requestUpgrade';
import SubmitButton from '@/components/SubmitButton';
import { ShieldCheck, CheckCircle2, Zap, Smartphone, HeadphonesIcon, AlertTriangle } from 'lucide-react';

export default function BillingPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setError(null);
    const res = await requestUpgrade();
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Nâng Cấp Gói Chuyên Nghiệp</h1>
        <p className="text-slate-500 mt-3 text-lg font-medium">Bảo vệ dữ liệu an toàn và mở khóa toàn bộ sức mạnh của LendOS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Cột Trái: Quyền lợi */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-6 border border-blue-100">
            <Zap size={16} className="text-amber-500 fill-amber-500" /> LendOS Premium
          </div>
          
          <div className="flex items-end gap-2 mb-8">
            <span className="text-6xl font-black text-slate-800 tracking-tighter">999.000</span>
            <span className="text-slate-500 font-bold mb-2">VNĐ / Năm</span>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Lưu trữ không giới hạn</h3>
                <p className="text-slate-500 mt-1">Tạo không giới hạn hợp đồng, quản lý khách hàng và lưu trữ lịch sử giao dịch mãi mãi.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <Smartphone size={24} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Zalo nhắc nợ tự động</h3>
                <p className="text-slate-500 mt-1">Gửi tin nhắn Zalo ZNS chuyên nghiệp cho khách khi đến hạn đóng lãi hoặc quá hạn.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <ShieldCheck size={24} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-800 text-lg">AI Quét CCCD Thần Tốc</h3>
                <p className="text-slate-500 mt-1">Bóc tách dữ liệu từ Căn cước công dân hoàn toàn tự động, loại bỏ thao tác gõ phím.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <HeadphonesIcon size={24} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Hỗ trợ kỹ thuật 24/7</h3>
                <p className="text-slate-500 mt-1">Kênh hỗ trợ ưu tiên trực tiếp qua Zalo hoặc Hotline với kỹ sư hệ thống của LendOS.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Thanh toán */}
        <div className="bg-[#0f172a] rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          
          <h2 className="text-2xl font-black mb-6 relative z-10">Thanh toán qua mã VietQR</h2>
          
          <div className="bg-white p-4 rounded-3xl w-max mx-auto mb-8 relative z-10 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <img 
              src="https://img.vietqr.io/image/MB-0123456789-compact2.jpg?amount=999000&addInfo=LENDOS%20UPGRADE&accountName=LENDOS%20SOFTWARE" 
              alt="VietQR Thanh Toán" 
              className="w-64 h-64 rounded-xl object-contain"
            />
            {success && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 size={56} className="text-emerald-500 mb-3 drop-shadow-sm" />
                <p className="text-slate-800 font-black text-center text-lg">Đã ghi nhận yêu cầu</p>
                <p className="text-slate-500 font-medium text-center text-sm mt-1">Vui lòng đợi 5 phút</p>
              </div>
            )}
          </div>

          {!success ? (
            <div className="space-y-5 relative z-10">
              <p className="text-slate-300 text-[15px] text-center font-medium">
                Mở ứng dụng Ngân hàng để quét mã. Sau khi chuyển khoản thành công, vui lòng bấm nút xác nhận bên dưới.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 justify-center animate-in fade-in">
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              <form action={handleUpgrade}>
                <SubmitButton 
                  text="TÔI ĐÃ CHUYỂN KHOẢN" 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-lg hover:from-blue-400 hover:to-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
                />
              </form>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-emerald-300 text-center text-[15px] font-medium animate-in slide-in-from-bottom-4 relative z-10">
              Đã gửi yêu cầu xác nhận. Hệ thống đang đối soát dòng tiền và sẽ tự động kích hoạt tài khoản của bạn. Xin cảm ơn!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
