import Link from 'next/link';
import { ArrowRight, Shield, Zap, Users, TrendingUp, Globe, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black text-white">L</div>
          <span className="font-black text-xl tracking-tight">LendOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors text-sm">Đăng nhập</Link>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
            Dùng thử miễn phí
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-2 text-sm font-medium text-blue-300 mb-8">
          <Star size={14} /> Hệ điều hành tài chính vi mô số 1 Việt Nam
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Quản lý cầm đồ<br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            thông minh hơn
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Nền tảng SaaS quản lý cầm đồ & cho vay vi mô. Tối ưu hóa quy trình, tăng doanh thu, giảm rủi ro. Thiết kế cho người lớn tuổi.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-blue-900/50">
            Bắt đầu ngay <ArrowRight size={20} />
          </Link>
          <button className="border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transition-colors">
            Xem demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Zap size={28} />, title: 'Zero-Typing', desc: 'Quét CCCD tự điền thông tin. Chọn gói lãi suất thay vì nhập tay.' },
          { icon: <Shield size={28} />, title: 'Multi-Tenancy', desc: 'Dữ liệu cô lập tuyệt đối giữa các cửa hàng. An toàn 100%.' },
          { icon: <TrendingUp size={28} />, title: '1-Click Migration', desc: 'Chuyển dữ liệu từ Excel sang hệ thống mới trong vài giây.' },
          { icon: <Users size={28} />, title: 'Elders-First UX', desc: 'Giao diện tối giản, phông lớn, nút bấm to cho người lớn tuổi.' },
          { icon: <Globe size={28} />, title: 'Zalo ZNS', desc: 'Tự động nhắc nợ qua Zalo. Không cần gọi điện thủ công.' },
          { icon: <Star size={28} />, title: 'In Bill K80', desc: 'In hóa đơn nhiệt K80, mã QR hợp đồng chỉ 1 click.' },
        ].map(f => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        © 2026 LendOS. Bắt đầu từ Việt Nam, tiến tới Go Global.
      </footer>
    </div>
  );
}
