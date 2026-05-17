import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Search, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const shopId = (session.user as any).shopId as string;

  const customers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { contracts: true } } },
  });

  const STATUS_LBL = { NORMAL: 'Bình thường', VIP: 'VIP', BLACKLIST: 'Đen sách' };
  const STATUS_CLS = { NORMAL: 'bg-emerald-100 text-emerald-700', VIP: 'bg-blue-100 text-blue-700', BLACKLIST: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Danh sách khách hàng</h1>
          <p className="page-subtitle">{customers.length} khách hàng trong hệ thống</p>
        </div>
        <button className="btn btn-primary"><Plus size={18} /> Thêm khách hàng</button>
      </div>

      <div className="card">
        <div className="card-body py-3 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input id="customer-search" placeholder="Tìm tên khách, CCCD, số điện thoại..." className="input pl-9 py-2 text-sm" />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <select className="select w-40 py-2 text-sm"><option>Tất cả</option><option>Bình thường</option><option>VIP</option></select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lendos-table">
            <thead>
              <tr><th>STT</th><th>Tên khách hàng</th><th>Địa chỉ</th><th>Điện thoại</th><th>CCCD/HC</th><th>HĐ</th><th>Ngày tạo</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id}>
                  <td className="text-slate-400 text-xs">{i + 1}</td>
                  <td className="font-bold text-blue-600">{c.fullName}</td>
                  <td className="text-sm text-slate-500 max-w-[150px] truncate">{c.address ?? '--'}</td>
                  <td className="text-slate-700">{c.phone ?? '--'}</td>
                  <td className="font-mono text-sm text-slate-500">{c.cccdNumber ?? '--'}</td>
                  <td className="text-center font-bold">{c._count.contracts}</td>
                  <td className="text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_CLS[c.status as keyof typeof STATUS_CLS] ?? STATUS_CLS.NORMAL}`}>
                      {STATUS_LBL[c.status as keyof typeof STATUS_LBL] ?? c.status}
                    </span>
                  </td>
                  <td><Link href={`/dashboard/customers/${c.id}`} className="btn-icon text-slate-500 hover:bg-slate-100"><Eye size={14} /></Link></td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">Chưa có khách hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
