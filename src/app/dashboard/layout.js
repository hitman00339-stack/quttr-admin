'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Store, Users, Calendar, Star, Bell,
  BarChart3, Settings, LogOut, Search, Command, Menu, X,
  Sparkles, Scissors, ChevronRight,
  AlertCircle, UserCheck, ShoppingBag,
} from 'lucide-react';
import { authService } from '../../services/auth';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Approvals', href: '/dashboard/approvals', icon: AlertCircle, highlight: true },
  { name: 'Shops', href: '/dashboard/shops', icon: Store },
  { name: 'Staff', href: '/dashboard/staff', icon: UserCheck },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBag },
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { name: 'Notices', href: '/dashboard/notices', icon: Bell },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }
      const result = await authService.verifyToken();
      if (!result.valid) {
        router.push('/login');
        return;
      }
      setAdmin(result.admin);
      setChecked(true);
    };
    check();
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-caption">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64
        bg-surface-100/80 backdrop-blur-2xl border-r border-white/[0.06]
        transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base">
              QUTTR<span className="text-accent-500 font-mono">·</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-icon lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-3 py-2 text-2xs font-semibold text-white/30 uppercase tracking-widest">
            Workspace
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link group ${isActive ? 'nav-link-active' : ''} ${
                  item.highlight && !isActive ? 'text-warning' : ''
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-accent-500' :
                  item.highlight ? 'text-warning' : ''
                }`} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-accent-500" />
                )}
                {item.highlight && !isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-surface-100 font-bold text-sm">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
              <p className="text-2xs text-white/40 truncate">{admin?.phone}</p>
            </div>
            <button
              onClick={() => authService.logout()}
              className="btn-icon text-white/40 hover:text-error"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-surface-50/80 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="h-full flex items-center justify-between px-4 lg:px-8 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-icon lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-white/20" />
              <span className="text-sm font-medium truncate">
                {navigation.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.name || 'Overview'}
              </span>
            </div>

            {/* Search */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 text-sm transition-colors min-w-[240px]">
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="text-2xs font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button className="btn-icon relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-surface-50" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 mesh-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
