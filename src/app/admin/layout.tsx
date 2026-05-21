import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'tr.tuan0707@gmail.com'; // Hardcode fallback for user's github email

  if (session.user.email !== superAdminEmail) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-red-900/20 text-red-400 p-8 rounded-3xl border border-red-900/50 max-w-md text-center shadow-2xl">
          <h1 className="text-6xl font-black mb-4">403</h1>
          <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
          <p className="text-sm opacity-80 leading-relaxed">Bạn không có quyền truy cập vào Khu vực Chỉ huy Super Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-black text-white text-xl tracking-wider flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">⚡</div> 
          LENDOS <span className="opacity-40 font-bold">COMMAND CENTER</span>
        </div>
        <div className="text-sm font-bold bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {session.user.email}
        </div>
      </nav>
      <main className="p-6 md:p-8 max-w-7xl mx-auto pb-20">
        {children}
      </main>
    </div>
  );
}
