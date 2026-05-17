import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { updateShopSettings } from '@/actions/updateShopSettings';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const shopId = (session.user as any).shopId;
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  
  if (!shop) return <div>Không tìm thấy dữ liệu cửa hàng.</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="page-title flex items-center gap-3"><Settings className="text-blue-600" /> Cài Đặt Cửa Hàng</h1>
        <p className="page-subtitle">Thông tin tại đây sẽ được in trực tiếp lên các loại Biên lai (K80).</p>
      </div>

      <div className="card p-8 border-2 border-slate-200">
        <form action={async (formData) => { "use server"; await updateShopSettings(formData); }} className="space-y-6">
          <div className="input-group">
            <label className="input-label text-xl">Tên Cửa Hàng (In trên Biên lai) *</label>
            <input required name="name" type="text" className="input text-2xl font-bold p-6" defaultValue={shop.name} />
          </div>
          
          <div className="input-group">
            <label className="input-label text-xl">Số Điện Thoại Liên Hệ</label>
            <input name="phone" type="text" className="input text-2xl font-bold p-6" defaultValue={shop.phone || ''} />
          </div>
          
          <div className="input-group">
            <label className="input-label text-xl">Địa Chỉ Cửa Hàng</label>
            <input name="address" type="text" className="input text-2xl font-bold p-6" defaultValue={shop.address || ''} />
          </div>

          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-start gap-3 mt-4">
            <AlertCircle className="shrink-0 mt-0.5" />
            <p className="font-medium text-lg">Mọi thay đổi sẽ có hiệu lực ngay lập tức. Khuyến nghị chỉ cấp quyền Sửa thông tin này cho Chủ cửa hàng.</p>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <button type="submit" className="w-full btn btn-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl py-8 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform">
              <Save size={32} /> LƯU CÀI ĐẶT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
