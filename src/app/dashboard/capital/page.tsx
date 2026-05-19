import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PieChart, PlusCircle, MinusCircle, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { adjustCapital } from '@/actions/adjustCapital';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CapitalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  const role = (session.user as any).role;
  
  if (role !== 'OWNER') {
    return (
      <div className="p-16 text-center bg-red-50 rounded-3xl border-4 border-red-200 max-w-3xl mx-auto mt-20">
        <ShieldAlert size={80} className="mx-auto text-red-500 mb-6" />
        <h1 className="text-4xl font-black text-red-700 mb-4">Không Có Quyền Truy Cập</h1>
        <p className="text-2xl font-bold text-red-600">Tính năng quản lý Nguồn Vốn được thiết kế Blind-Trust, chỉ dành riêng cho Chủ cửa hàng.</p>
      </div>
    );
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    
    return (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
        <div>
          <h1 className="page-title flex items-center gap-3"><PieChart className="text-blue-600" /> Quản Lý Nguồn Vốn</h1>
          <p className="page-subtitle text-xl">Bơm hoặc rút tiền mặt ra khỏi quỹ. Dữ liệu sẽ tự động đồng bộ vào Sổ Quỹ.</p>
        </div>

        <div className="bg-blue-600 rounded-[2rem] p-12 text-center text-white shadow-2xl shadow-blue-600/30">
          <p className="text-blue-200 text-2xl font-bold mb-4 tracking-wider">TỔNG QUỸ TIỀN MẶT HIỆN TẠI</p>
          <div className="text-7xl font-black tracking-tighter">{formatCurrency(shop?.cashBalance || 0)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-10 border-4 border-emerald-200 bg-emerald-50/50 shadow-xl">
            <h2 className="text-3xl font-black text-emerald-800 flex items-center gap-3 mb-8"><PlusCircle size={36}/> BƠM THÊM VỐN</h2>
            <form action={async (formData) => { "use server"; await adjustCapital(formData); }} className="space-y-6">
              <input type="hidden" name="actionType" value="ADD" />
              <div>
                <label className="block font-bold text-emerald-800 text-xl mb-2">Số tiền nạp vào (VNĐ)</label>
                <input required name="amount" type="number" className="w-full p-6 text-3xl font-black text-emerald-700 rounded-2xl border-2 border-emerald-300 focus:border-emerald-600 outline-none" placeholder="100000000" />
              </div>
              <div>
                <label className="block font-bold text-emerald-800 text-lg mb-2">Lý do (Tùy chọn)</label>
                <input name="description" type="text" className="w-full p-4 text-xl font-bold rounded-xl border-2 border-emerald-200 outline-none" defaultValue="Bơm vốn kinh doanh" />
              </div>
              <div className="pt-4">
                <SubmitButton 
                  text="XÁC NHẬN NẠP VỐN" 
                  className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-2 text-2xl shadow-xl shadow-emerald-500/30 active:scale-[0.98]" 
                />
              </div>
            </form>
          </div>

          <div className="card p-10 border-4 border-red-200 bg-red-50/50 shadow-xl">
            <h2 className="text-3xl font-black text-red-800 flex items-center gap-3 mb-8"><MinusCircle size={36}/> RÚT BỚT VỐN</h2>
            <form action={async (formData) => { "use server"; await adjustCapital(formData); }} className="space-y-6">
              <input type="hidden" name="actionType" value="WITHDRAW" />
              <div>
                <label className="block font-bold text-red-800 text-xl mb-2">Số tiền rút ra (VNĐ)</label>
                <input required name="amount" type="number" className="w-full p-6 text-3xl font-black text-red-700 rounded-2xl border-2 border-red-300 focus:border-red-600 outline-none" placeholder="10000000" />
              </div>
              <div>
                <label className="block font-bold text-red-800 text-lg mb-2">Lý do (Tùy chọn)</label>
                <input name="description" type="text" className="w-full p-4 text-xl font-bold rounded-xl border-2 border-red-200 outline-none" defaultValue="Rút lợi nhuận" />
              </div>
              <div className="pt-4">
                <SubmitButton 
                  text="XÁC NHẬN RÚT VỐN" 
                  className="w-full btn bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-2 text-2xl shadow-xl shadow-red-500/30 active:scale-[0.98]" 
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể tải dữ liệu nguồn vốn. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
