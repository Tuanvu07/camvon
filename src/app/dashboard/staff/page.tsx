import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { createStaff } from '@/actions/createStaff';
import { Users, UserPlus, Shield } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  const currentUserRole = (session.user as any).role;
  
  const staffMembers = await prisma.shopUser.findMany({
    where: { shopId },
    include: { user: true },
    orderBy: { user: { createdAt: 'desc' } }
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="page-title flex items-center gap-3"><Users className="text-blue-600" /> Quản Lý Nhân Viên</h1>
        <p className="page-subtitle">Kiến trúc Blind-Trust: Nhân viên (STAFF) không thể xem được Sổ quỹ và Dòng tiền của nhau hay của cửa hàng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Danh sách nhân viên */}
        <div className="lg:col-span-2 card p-0 overflow-hidden border-2 border-slate-200">
          <div className="overflow-x-auto">
            <table className="lendos-table w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="py-5 px-6 text-left text-lg font-bold text-slate-700">Họ và Tên</th>
                  <th className="py-5 px-6 text-left text-lg font-bold text-slate-700">Tài Khoản Đăng Nhập</th>
                  <th className="py-5 px-6 text-left text-lg font-bold text-slate-700">Quyền (Role)</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map(staff => (
                  <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-6 font-black text-slate-800 text-xl">{staff.user.name}</td>
                    <td className="py-5 px-6 font-mono text-slate-600 font-bold">{staff.user.username}</td>
                    <td className="py-5 px-6">
                      <span className={`px-4 py-2 rounded-xl font-bold text-sm inline-block ${staff.role === 'OWNER' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {staff.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form thêm nhân viên (Chỉ dành cho Quản lý) */}
        {currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' ? (
          <div className="lg:col-span-1">
            <div className="card p-6 border-2 border-blue-200 bg-blue-50/50 shadow-lg shadow-blue-500/10">
              <h2 className="text-2xl font-black text-blue-800 flex items-center gap-2 mb-6">
                <UserPlus size={28} /> Thêm Nhân Viên
              </h2>
              
              <form action={createStaff} className="space-y-6">
                <div className="input-group">
                  <label className="input-label font-bold text-lg">Tên Hiển Thị (Họ Tên) *</label>
                  <input required name="name" type="text" className="input p-5 text-xl font-bold" placeholder="VD: Nguyễn Văn B" />
                </div>
                
                <div className="input-group">
                  <label className="input-label font-bold text-lg">Tên Đăng Nhập (Username) *</label>
                  <input required name="username" type="text" className="input p-5 text-xl font-mono" placeholder="nhanvien1" />
                </div>
                
                <div className="bg-white/80 p-5 rounded-2xl border border-blue-200">
                  <p className="text-base font-black text-blue-800 flex items-center gap-2 mb-2"><Shield size={20}/> Ghi chú bảo mật:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium text-sm">
                    <li>Mật khẩu mặc định là: <strong className="text-blue-700">123456</strong></li>
                    <li>Tài khoản sẽ được tự động mã hóa băm an toàn.</li>
                    <li>Tài khoản được gán sẵn quyền <strong className="text-emerald-700">STAFF</strong>.</li>
                  </ul>
                </div>
                
                <button type="submit" className="w-full btn btn-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-transform">
                  <UserPlus size={24} /> TẠO TÀI KHOẢN
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-1">
            <div className="card p-8 border-2 border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center">
                <Shield size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Giới hạn quyền hạn</h3>
              <p className="text-slate-500 font-medium">Bạn không có quyền Thêm nhân viên. Chức năng này chỉ dành cho Chủ cửa hàng.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
