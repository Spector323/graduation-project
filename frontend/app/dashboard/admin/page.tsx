'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, Users, ShoppingCart, DollarSign, CreditCard, Banknote,
  Percent, Utensils, Clock, Calendar, ArrowUpRight, ArrowDownRight,
  Award, Activity, PieChart, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DashboardStats {
  totalRevenue: number;
  cardRevenue: number;
  cashRevenue: number;
  bonusRevenue: number;
  totalDiscounts: number;
  totalBonuses: number;
  totalOrders: number;
  totalGuests: number;
  averageCheck: number;
  averageCheckPerGuest: number;
  margin: number;
  foodCost: number;
  pendingOrders: number;
  openOrders: number;
  occupiedTables: number;
  occupiedSeats: number;
  openShifts: number;
  totalShifts: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [writeOffs, setWriteOffs] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  async function fetchStats() {
    try {
      setLoading(true);
      const [statsRes, topItemsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard?from=${dateRange.from}&to=${dateRange.to}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/popular-items?limit=5&from=${dateRange.from}&to=${dateRange.to}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }
        ),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (topItemsRes.ok) {
        const data = await topItemsRes.json();
        setTopItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    // Первый ряд - Финансы
    {
      label: 'Продажи',
      value: stats ? `${stats.totalRevenue.toLocaleString('ru-RU')} ₽` : '—',
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-500',
    },
    {
      label: 'Оплата картой',
      value: stats ? `${stats.cardRevenue.toLocaleString('ru-RU')} ₽` : '—',
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-500',
    },
    {
      label: 'Оплата наличными',
      value: stats ? `${stats.cashRevenue.toLocaleString('ru-RU')} ₽` : '—',
      icon: Banknote,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-500',
    },
    {
      label: 'Оплата бонусами',
      value: stats ? `${stats.bonusRevenue.toLocaleString('ru-RU')} ₽` : '—',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-500',
    },
    {
      label: 'Сумма скидок',
      value: stats ? `${stats.totalDiscounts.toLocaleString('ru-RU')} ₽` : '—',
      icon: Percent,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      borderColor: 'border-pink-500',
    },
    {
      label: 'Начислено бонусов',
      value: stats ? `${stats.totalBonuses.toLocaleString('ru-RU')} ₽` : '—',
      icon: Award,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderColor: 'border-indigo-500',
    },
    // Второй ряд - Заказы и гости
    {
      label: 'Заказов',
      value: stats ? stats.totalOrders.toString() : '—',
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-500',
    },
    {
      label: 'Гостей',
      value: stats ? stats.totalGuests.toString() : '—',
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      borderColor: 'border-cyan-500',
    },
    {
      label: 'Средний чек по заказу',
      value: stats ? `${stats.averageCheck.toLocaleString('ru-RU')} ₽` : '—',
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'border-teal-500',
    },
    {
      label: 'Средний чек по гостю',
      value: stats ? `${stats.averageCheckPerGuest.toLocaleString('ru-RU')} ₽` : '—',
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      borderColor: 'border-sky-500',
    },
    {
      label: 'Маржа',
      value: stats ? `${stats.margin.toLocaleString('ru-RU')} ₽` : '—',
      icon: BarChart3,
      color: 'text-lime-600',
      bg: 'bg-lime-50 dark:bg-lime-950/30',
      borderColor: 'border-lime-500',
    },
    {
      label: 'Фудкост, %',
      value: stats ? `${stats.foodCost}%` : '—',
      icon: PieChart,
      color: stats && stats.foodCost < 30 ? 'text-green-600' : 'text-red-600',
      bg: stats && stats.foodCost < 30 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30',
      borderColor: stats && stats.foodCost < 30 ? 'border-green-500' : 'border-red-500',
    },
    // Третий ряд - Операционка
    {
      label: 'Ожидает продаж',
      value: stats ? stats.pendingOrders.toString() : '—',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-500',
    },
    {
      label: 'Открыто заказов',
      value: stats ? stats.openOrders.toString() : '—',
      icon: Utensils,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-500',
    },
    {
      label: 'Занято столов',
      value: stats ? stats.occupiedTables.toString() : '—',
      icon: Calendar,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-500',
    },
    {
      label: 'Занято мест',
      value: stats ? stats.occupiedSeats.toString() : '—',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      borderColor: 'border-violet-500',
    },
    {
      label: 'Открыто смен',
      value: stats ? stats.openShifts.toString() : '—',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-500',
    },
    {
      label: 'Всего смен',
      value: stats ? stats.totalShifts.toString() : '—',
      icon: Calendar,
      color: 'text-slate-600',
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      borderColor: 'border-slate-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            Главная
          </h1>
          <p className="text-muted-foreground text-sm mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
          </p>
        </div>

        {/* Выбор периода */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="bg-transparent text-sm border-none focus:outline-none"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="bg-transparent text-sm border-none focus:outline-none"
            />
          </div>
          <Button onClick={() => fetchStats()} size="sm">
            Обновить
          </Button>
        </div>
      </div>

      {/* Сетка статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={`border-l-4 ${card.borderColor} shadow-sm hover:shadow-lg transition-all duration-300`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Графики и топы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ продаж */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Топ продаж
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                          <span className="text-sm font-semibold">
                            {item.revenue.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Продано: {item.quantity} шт.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Списания товаров */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-destructive" />
              Списания товаров
            </CardTitle>
          </CardHeader>
          <CardContent>
            {writeOffs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет списаний</p>
            ) : (
              <div className="space-y-3">
                {writeOffs.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {item.percentage}%
                          </Badge>
                          <span className="text-sm font-semibold">
                            {item.revenue.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Списано: {item.quantity} шт.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Продажи по гостям и оплатам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Продажи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Наличные</span>
                  <span className="font-semibold">{stats.cashRevenue.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Безналичные</span>
                  <span className="font-semibold">{stats.cardRevenue.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between font-bold">
                  <span>Итого</span>
                  <span className="text-primary text-lg">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Продажи по гостям</CardTitle>
            <p className="text-sm text-muted-foreground">
              {stats ? stats.totalGuests : '—'} гостей
            </p>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Средний чек по гостю</span>
                  <span className="font-semibold">{stats.averageCheckPerGuest.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.averageCheckPerGuest / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
