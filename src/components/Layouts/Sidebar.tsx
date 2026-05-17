'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, ChevronDown, ChevronRight,
  Wallet, BarChart2, Settings, Users, Package,
  Clock, AlertTriangle, CheckCircle, TrendingDown,
  BookOpen, MessageSquare, Building2, Boxes,
  Banknote, PieChart, Bell, LogOut
} from 'lucide-react';

interface SubItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  children?: SubItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Bảng điều khiển',
    icon: <LayoutDashboard size={18} />,
    href: '/dashboard',
  },
  {
    label: 'Cầm đồ',
    icon: <FileText size={18} />,
    badge: 40,
    children: [
      { label: 'Đang cầm', href: '/dashboard/contracts', icon: <Clock size={14} /> },
      { label: 'Tạo hợp đồng', href: '/dashboard/contracts/new', icon: <FileText size={14} /> },
    ],
  },
  {
    label: 'Trả góp',
    icon: <TrendingDown size={18} />,
    href: '/dashboard/installments',
  },
  {
    label: 'Thanh lý',
    icon: <AlertTriangle size={18} />,
    href: '/dashboard/liquidations',
  },
  {
    label: 'DS Khách hàng',
    icon: <Users size={18} />,
    href: '/dashboard/customers',
  },
  {
    label: 'Sổ quỹ',
    icon: <Wallet size={18} />,
    href: '/dashboard/cashbook',
  },
  {
    label: 'Báo cáo',
    icon: <BookOpen size={18} />,
    href: '/dashboard/reports',
  },
  {
    label: 'Quản lý cửa hàng',
    icon: <Building2 size={18} />,
    href: '/dashboard/shops',
  },
  {
    label: 'Quản lý nguồn vốn',
    icon: <PieChart size={18} />,
    href: '/dashboard/capital',
  },
  {
    label: 'Quản lý nhân viên',
    icon: <Users size={18} />,
    href: '/dashboard/staff',
  },
  {
    label: 'Thống kê',
    icon: <BarChart2 size={18} />,
    href: '/dashboard/analytics',
  },
  {
    label: 'Kho',
    icon: <Boxes size={18} />,
    href: '/dashboard/inventory',
  },
];

function SidebarNavItem({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (group.href) return false;
    return group.children?.some(c => pathname.startsWith(c.href)) ?? false;
  });

  const isActive = group.href ? pathname === group.href || (group.href !== '/dashboard' && pathname.startsWith(group.href)) : false;

  if (group.href) {
    return (
      <Link
        href={group.href}
        className={cn('sidebar-item', isActive && 'active')}
      >
        <span className="opacity-80 flex-shrink-0">{group.icon}</span>
        <span className="flex-1 truncate">{group.label}</span>
        {group.badge !== undefined && (
          <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center">
            {group.badge}
          </span>
        )}
      </Link>
    );
  }

  const hasActiveChild = group.children?.some(c => pathname.startsWith(c.href));

  return (
    <div>
      <button
        onClick={() => setOpen(p => !p)}
        className={cn('sidebar-item w-full text-left', hasActiveChild && !open && 'text-blue-400 bg-white/5')}
      >
        <span className="opacity-80 flex-shrink-0">{group.icon}</span>
        <span className="flex-1 truncate">{group.label}</span>
        {group.badge !== undefined && (
          <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center mr-1">
            {group.badge}
          </span>
        )}
        <span className="opacity-60 flex-shrink-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="animate-fade-in">
          {group.children?.map(child => {
            const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn('sidebar-sub-item', childActive && 'active')}
              >
                {child.icon && <span>{child.icon}</span>}
                {!child.icon && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 flex-shrink-0" />}
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-black text-sm">L</span>
        </div>
        <div className="min-w-0">
          <div className="text-white font-black text-base leading-none tracking-tight">LendOS</div>
          <div className="text-blue-300 text-[10px] font-medium mt-0.5 truncate">Cầm đồ Hoà Phát</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {NAV_GROUPS.map((group) => (
            <SidebarNavItem key={group.label} group={group} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link href="/dashboard/settings" className="sidebar-item">
          <Settings size={16} />
          <span>Cài đặt</span>
        </Link>
        <button className="sidebar-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
