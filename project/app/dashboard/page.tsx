'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Order, Table, Reservation } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TableIcon, ClipboardList, CalendarDays, TrendingUp,
  Clock, CheckCircle2, ChefHat, AlertCircle, DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Stats {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  totalRevenue: number;
  totalTables: number;
  occupiedTables: number;
  freeTables: number;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COOKING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  READY: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, activeOrders: 0, completedToday: 0,
    totalRevenue: 0, totalTables: 0, occupiedTables: 0, freeTables: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?limit=5`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setRecentOrders(await ordersRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Заказов сегодня',
      value: stats.completedToday,
      sub: `${stats.activeOrders} активных`,
      icon: ClipboardList,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Выручка сегодня',
      value: `${stats.totalRevenue.toFixed(0)} ₽`,
      sub: 'Завершённые заказы',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Свободных столов',
      value: stats.freeTables,
      sub: `из ${stats.totalTables} всего`,
      icon: TableIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Всего заказов',
      value: stats.totalOrders,
      sub: 'За всё время',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  const orderStatusIcon = (status: string) => {
    if (status === 'NEW') return <Clock className="w-3.5 h-3.5" />;
    if (status === 'COOKING') return <ChefHat className="w-3.5 h-3.5" />;
    if (status === 'READY') return <CheckCircle2 className="w-3.5 h-3.5" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  const statusLabels: Record<string, string> = {
    NEW: 'Новый',
    COOKING: 'Готовится',
    READY: 'Готов',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Добрый {new Date().getHours() < 12 ? 'день' : new Date().getHours() < 18 ? 'день' : 'вечер'},
          {' '}{user?.fullName?.split(' ')[0] || 'пользователь'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })} — Вот что происходит сегодня.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{loading ? '—' : card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className={cn('p-2.5 rounded-xl', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Последние заказы
            </CardTitle>
            <span className="text-xs text-muted-foreground">{recentOrders.length} заказов</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Нет недавних заказов</p>
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">#{order.table?.number || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Стол {order.table?.number || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{order.waiter?.fullName || 'Неизвестно'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(order.createdAt), 'HH:mm')} — {Number(order.total).toFixed(0)} ₽
                    </div>
                  </div>
                  <Badge className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5', statusColors[order.status])}>
                    {orderStatusIcon(order.status)}
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
