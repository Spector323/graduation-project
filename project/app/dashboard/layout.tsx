'use client';

import { useState } from 'react';
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
} from 'lucide-react';

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'WAITER', 'COOK'] },
  { name: 'Меню', href: '/dashboard/menu', icon: Utensils, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Работа официанта', href: '/dashboard/waiter', icon: Coffee, roles: ['WAITER', 'ADMIN', 'MANAGER'] },
  { name: 'Столы', href: '/dashboard/tables', icon: Table, roles: ['ADMIN', 'MANAGER', 'WAITER'] },
  { name: 'Заказы', href: '/dashboard/orders', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'WAITER', 'COOK'] },
  { name: 'Кухня', href: '/dashboard/kitchen', icon: ChefHat, roles: ['COOK', 'ADMIN'] },
  { name: 'Бронь', href: '/dashboard/reservations', icon: CalendarDays, roles: ['ADMIN', 'MANAGER', 'WAITER'] },
  { name: 'Сотрудники', href: '/dashboard/users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Настройки', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userRole = user?.role || 'WAITER';
  const navItems = navigation.filter((item) => item.roles.includes(userRole as string));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold">RestaurantOS</span>
                {user?.establishment && (
                  <p className="text-xs text-muted-foreground leading-tight">{user.establishment.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName || 'Пользователь'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role || 'Роль'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.role === 'ADMIN' && 'Администратор'}
                {user?.role === 'MANAGER' && 'Менеджер'}
                {user?.role === 'WAITER' && 'Официант'}
                {user?.role === 'COOK' && 'Повар'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

