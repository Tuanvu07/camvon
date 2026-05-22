import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatVNDate } from '@/lib/timezone';
import { formatCurrency } from '@/lib/utils';
import { ShieldAlert, History, ArrowRight, User as UserIcon, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

function DiffViewer({ oldData, newData }: { oldData: string | null, newData: string | null }) {
  if (!oldData && !newData) return null;
  
  let oldObj: any = {};
  let newObj: any = {};
  
  try {
    if (oldData) oldObj = JSON.parse(oldData);
    if (newData) newObj = JSON.parse(newData);
  } catch (e) {}

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  return (
    <div className="mt-4 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <div className="flex bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider px-4 py-2 border-b border-slate-700">
        <div className="flex-1">Trước khi sửa</div>
        <div className="flex-1 border-l border-slate-700 pl-4">Sau khi sửa</div>
      </div>
      <div className="p-4 space-y-3 font-mono text-sm">
        {allKeys.map(key => {
          const oldVal = oldObj[key];
          const newVal = newObj[key];
          
          if (oldVal === newVal && key !== 'collectedInterest' && key !== 'paidAmount' && key !== 'soldAmount') return null; // Only show changes or important monetary values

          const isMoney = key.toLowerCase().includes('amount') || key.toLowerCase().includes('interest') || key.toLowerCase().includes('balance');
          
          const displayOld = isMoney && typeof oldVal === 'number' ? formatCurrency(oldVal) : String(oldVal ?? 'N/A');
          const displayNew = isMoney && typeof newVal === 'number' ? formatCurrency(newVal) : String(newVal ?? 'N/A');

          return (
            <div key={key} className="flex flex-col md:flex-row gap-2 md:gap-4 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
              <div className="text-slate-500 font-bold w-32 shrink-0">{key}:</div>
              <div className="flex flex-1 items-center gap-4">
                <div className="flex-1 text-red-400 bg-red-400/10 px-2 py-1 rounded line-through break-all">
                  {displayOld}
                </div>
                <ArrowRight size={14} className="text-slate-600 shrink-0" />
                <div className="flex-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-black break-all">
                  {displayNew}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = session.user as any;
  const shopId = user.shopId;
  const role = user.role;

  // LÁ CHẮN BẢO MẬT: CHỈ OWNER MỚI ĐƯỢC XEM (Anti-Fraud)
  if (role !== 'OWNER' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const logs = await prisma.auditLog.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: 100, // Show last 100 logs
    include: {
      user: { select: { name: true, email: true } },
      contract: { select: { contractCode: true, customer: { select: { fullName: true } } } }
    }
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('RENEW') || action.includes('PAY_PARTIAL')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE') || action.includes('LIQUIDATE')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (action.includes('DELETE') || action.includes('REVERT')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getActionLabel = (action: string) => {
    const map: any = {
      'RENEW_CONTRACT': 'Thu Lãi & Gia Hạn',
      'PAY_PARTIAL_PRINCIPAL': 'Thu Bớt Gốc',
      'LIQUIDATE_CONTRACT': 'Thanh Lý Tài Sản',
      'CREATE_CONTRACT': 'Tạo Hợp Đồng Mới',
      'DELETE_TRANSACTION': 'Xóa Phiếu Thu/Chi',
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-xl">
              <ShieldAlert size={28} className="text-rose-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Nhật Ký Kiểm Toán</h1>
          </div>
          <p className="text-slate-400 text-lg">Hệ thống sổ cái bất biến (Immutable Ledger). Mọi thay đổi dữ liệu, dòng tiền đều được khắc ghi vĩnh viễn, chống mọi nỗ lực gian lận.</p>
          <div className="mt-6 flex gap-3">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/20">OWNER ONLY</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/20">KHÔNG THỂ XÓA</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-6 text-slate-800 font-black text-xl px-2">
          <History size={24} className="text-blue-600" />
          <span>Lịch sử thao tác (100 hành động gần nhất)</span>
        </div>

        <div className="space-y-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <div className="font-bold">Chưa có bản ghi kiểm toán nào</div>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-slate-100 ml-2">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-12 pb-8 last:pb-0 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-[15px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-white group-hover:scale-150 transition-transform shadow-sm"></div>
                  
                  <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                          <UserIcon size={14} className="text-slate-400" />
                          {log.user?.name || 'Hệ thống'}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                        <History size={14} />
                        {formatVNDate(log.createdAt)}
                      </div>
                    </div>

                    {log.contract && (
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-blue-500" />
                        <span className="font-semibold text-slate-600">Hợp đồng:</span>
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{log.contract.contractCode}</span>
                        <span className="text-slate-500 font-medium">({log.contract.customer.fullName})</span>
                      </div>
                    )}

                    {/* Diff Viewer for Data Mutations */}
                    <DiffViewer oldData={log.oldData} newData={log.newData} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
