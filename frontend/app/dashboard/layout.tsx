'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Utensils,
  Table,
  ClipboardList,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  ChefHat,
  Settings,
  Coffee,
  Store,
  BarChart3,
  LayoutGrid,
  ShoppingCart,
  Package,
  Hand,
  CreditCard,
  Building2,
  Globe,
  Shield,
  History,
} from 'lucide-react';

const ROLE_NAV_MAP: Record<string, { name: string; href: string; icon: any }[]> = {
  ADMIN: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Меню', href: '/dashboard/menu', icon: Utensils },
    { name: 'Склад', href: '/dashboard/inventory', icon: Package },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Касса (POS)', href: '/dashboard/pos', icon: CreditCard },
    { name: 'Аналитика', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Сотрудники', href: '/dashboard/users', icon: Users },
    { name: 'Настройки', href: '/dashboard/settings', icon: Settings },
  ],
  MANAGER: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Меню', href: '/dashboard/menu', icon: Utensils },
    { name: 'Склад', href: '/dashboard/inventory', icon: Package },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Касса (POS)', href: '/dashboard/pos', icon: CreditCard },
    { name: 'Аналитика', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Сотрудники', href: '/dashboard/users', icon: Users },
    { name: 'Настройки', href: '/dashboard/settings', icon: Settings },
  ],
  WAITER: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Касса (POS)', href: '/dashboard/pos', icon: CreditCard },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
  ],
  CASHIER: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Касса (POS)', href: '/dashboard/pos', icon: CreditCard },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
  ],
  COOK: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Кухня', href: '/dashboard/kitchen', icon: ChefHat },
  ],
  BARISTA: [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Касса (POS)', href: '/dashboard/pos', icon: CreditCard },
    { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  WAITER: 'Официант',
  COOK: 'Повар',
  CASHIER: 'Кассир',
  BARISTA: 'Бариста',
  PLATFORM_OWNER: 'Владелец платформы',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userRole = user?.role || 'WAITER';
  const navItems = ROLE_NAV_MAP[userRole] || ROLE_NAV_MAP.WAITER;
  const roleLabel = ROLE_LABELS[userRole] || userRole;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-card to-card/95 border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">RestaurantOS</span>
                {user?.establishment && (
                  <p className="text-xs text-muted-foreground font-medium leading-tight mt-0.5">{user.establishment.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent/50 hover:shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="p-2 rounded-lg group-hover:bg-primary/10 transition-colors duration-300">
                  <item.icon className="w-4 h-4" />
                </div>
                <span>{item.name}</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border/50 space-y-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{user?.fullName || 'Пользователь'}</p>
                  <p className="text-xs text-muted-foreground font-medium truncate">{roleLabel}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border hover:border-destructive/30 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
