'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Bell, Search, ChevronDown, User, Store, Calendar, LogOut } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Header() {
  const { data: session } = useSession();
  const today    = new Date();
  const shopName = (session?.user as any)?.shopName ?? 'LendOS';
  const userName = (session?.user as any)?.name ?? session?.user?.email ?? '--';

  return (
    <header className="dashboard-header">
      {/* Left: Date */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={14} />
          <span className="font-medium text-slate-700">{formatDate(today)}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <input
            id="header-search"
            type="text"
            placeholder="Tìm hợp đồng, khách hàng..."
            className="w-64 pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50
                       focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Notifications */}
        <Link
          href="/dashboard/reports/reminders"
          id="btn-notifications"
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title="Nhắc nợ"
        >
          <Bell size={18} />
        </Link>

        {/* Shop name badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
          <Store size={15} className="text-blue-600" />
          <span className="max-w-[120px] truncate">{shopName}</span>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                            flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden md:block">{userName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Đăng xuất"
            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
