import Link from 'next/link';
import { Shield, Fingerprint, RefreshCw, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white text-xl leading-none">L</span>
            </div>
            LendOS<span className="text-emerald-400">.</span>
          </div>
          <Link href="/login" className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/10 transition-all text-sm uppercase tracking-wider">
            Đăng Nhập Cửa Hàng
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden rounded-b-[3rem] lg:rounded-b-[5rem] shadow-2xl">
        {/* Subtle background patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500 blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold text-sm tracking-wide uppercase flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LendOS Phiên Bản Thương Mại
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
            Hệ Điều Hành <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">Tài Chính Vi Mô.</span>
          </h1>
          <p className="text-xl lg:text-2xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed mb-12">
            Giải pháp quản lý cầm đồ thông minh. Tự động hóa toàn trình. Bảo mật tuyệt đối. Thiết kế chuyên biệt mang chuẩn mực Quiet Luxury.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link href="/login" className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group">
              Trải nghiệm ngay <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-10 py-5 rounded-full bg-transparent hover:bg-slate-800 border-2 border-slate-700 text-white font-bold text-lg transition-all active:scale-95 text-center">
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* CORE MOATS SECTION */}
      <section id="features" className="py-24 lg:py-32 bg-slate-50 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Lợi thế cạnh tranh</h2>
            <h3 className="text-4xl font-black text-slate-900">Chuẩn mực mới của sự hoàn hảo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <Fingerprint size={32} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4">Zero-Typing &<br/>Elders-First</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Giao diện tối giản, tích hợp công nghệ AI OCR quét mã CCCD. Thao tác hoàn toàn bằng hệ thống nút bấm cỡ lớn, tối ưu hóa triệt để cho mọi độ tuổi người dùng.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8">
                <Shield size={32} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4">Blind-Trust<br/>Security</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Kiến trúc mù thông tin tiên tiến. Phân quyền nhân sự ngặt nghèo đa cấp độ, kiểm soát quyền truy cập dòng tiền, ngăn chặn hoàn toàn rủi ro thất thoát nội bộ.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8">
                <RefreshCw size={32} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4">Automated<br/>Migration</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Công nghệ chuyển đổi dữ liệu 1-chạm đột phá. Nhập liệu và đồng bộ hàng ngàn hợp đồng từ mọi hệ thống cũ lên nền tảng Cloud chỉ trong vài giây.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Sẵn sàng để đưa doanh nghiệp của bạn lên tầm cao mới?</h2>
          <Link href="/login" className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
            Đăng nhập hệ thống <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-800 pb-12 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                <span className="text-white text-sm leading-none">L</span>
              </div>
              LendOS<span className="text-emerald-500">.</span>
            </div>
            <p className="text-slate-500 max-w-sm font-medium">
              SaaS Quản lý Cầm đồ và Tài chính vi mô mang thiết kế Quiet Luxury. Đơn giản, an toàn và tinh tế.
            </p>
          </div>
          
          <div>
            <h5 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Sản phẩm</h5>
            <ul className="space-y-3 font-medium">
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Tính năng lõi</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Bảo mật Blind-Trust</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Bảng giá (Đang cập nhật)</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Building in Public</h5>
            <ul className="space-y-3 font-medium">
              <li><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2">TikTok Journey</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2">Instagram Behind The Scenes</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Changelog</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 font-medium text-sm">
          <p>© {new Date().getFullYear()} LendOS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
