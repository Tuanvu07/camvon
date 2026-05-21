import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';

export default async function TrialBouncer() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;

  const shopId = (session.user as any).shopId;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { trialEndsAt: true, plan: true, upgradeRequested: true }
  });

  if (!shop || !shop.trialEndsAt) return null;

  const now = new Date();
  const isExpired = now > shop.trialEndsAt && shop.plan === 'FREE';
  const daysLeft = Math.ceil((shop.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-amber-600 px-6 py-3 flex flex-col md:flex-row items-center justify-between shadow-md relative z-50 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shrink-0">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <p className="text-white font-semibold text-sm md:text-base tracking-wide">
            Phiên bản dùng thử của bạn đã hết hạn. Hệ thống đang bị khóa chức năng ghi mới dữ liệu. Vui lòng nâng cấp.
          </p>
        </div>
        
        <Link 
          href="/dashboard/billing" 
          className="shrink-0 bg-white text-red-600 hover:bg-red-50 px-5 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors whitespace-nowrap"
        >
          {shop.upgradeRequested ? 'Đang xử lý nâng cấp...' : 'Nâng Cấp Ngay'}
        </Link>
      </div>
    );
  }

  // Warning if less than 3 days left
  if (shop.plan === 'FREE' && daysLeft <= 3 && daysLeft >= 0) {
    return (
      <div className="bg-blue-600 px-6 py-2 flex flex-col md:flex-row items-center justify-between shadow-sm relative z-50 gap-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-200" />
          <p className="text-blue-50 text-sm font-medium">
            Thời gian dùng thử của bạn còn <strong className="text-white bg-blue-500 px-2 py-0.5 rounded-md mx-1">{daysLeft} ngày</strong>.
          </p>
        </div>
        
        <Link 
          href="/dashboard/billing" 
          className="shrink-0 text-blue-100 hover:text-white font-bold text-sm transition-colors underline decoration-blue-400 underline-offset-4"
        >
          Xem bảng giá
        </Link>
      </div>
    );
  }

  return null;
}
