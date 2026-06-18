'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Order } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket-context';
import {
  ClipboardList, CalendarDays, TrendingUp,
  Clock, CheckCircle2, DollarSign,
  Users, Percent,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Stats {
  totalRevenue: number;
  totalPaymentsCard: number;
  totalPaymentsCash: number;
  totalBonuses: number;
  totalDiscounts: number;
  totalBonusesAccrued: number;
  totalOrders: number;
  totalGuests: number;
  avgCheck: number;
  avgCheckPerGuest: number;
  totalMargin: number;
  foodCostPercent: number;
  pendingOrders: number;
  openOrders: number;
  occupiedTables: number;
  occupiedSeats: number;
  openShifts: number;
  totalShifts: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalPaymentsCard: 0, totalPaymentsCash: 0,
    totalBonuses: 0, totalDiscounts: 0, totalBonusesAccrued: 0,
    totalOrders: 0, totalGuests: 0, avgCheck: 0, avgCheckPerGuest: 0,
    totalMargin: 0, foodCostPercent: 0, pendingOrders: 0, openOrders: 0,
    occupiedTables: 0, occupiedSeats: 0, openShifts: 0, totalShifts: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/dashboard`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?limit=10&status=NEW,COOKING,READY`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!socket) return;
    socket.on('order:created', fetchData);
    socket.on('order:updated', fetchData);
    return () => { socket.off('order:created', fetchData); socket.off('order:updated', fetchData); };
  }, [socket, fetchData]);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'доброе утро' : today.getHours() < 18 ? 'добрый день' : 'добрый вечер';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
          {greeting}, {user?.fullName?.split(' ')[0] || 'пользователь'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {format(today, 'EEEE, d MMMM yyyy', { locale: ru })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Продажи', value: `${stats.totalRevenue.toLocaleString('ru-RU')} ₽`, color: 'blue', top: true },
          { label: 'Оплата картой', value: `${stats.totalPaymentsCard.toLocaleString('ru-RU')} ₽`, color: 'blue' },
          { label: 'Оплата наличными', value: `${stats.totalPaymentsCash.toLocaleString('ru-RU')} ₽`, color: 'green' },
          { label: 'Оплата бонусами', value: `${stats.totalBonuses.toLocaleString('ru-RU')} ₽`, color: 'blue' },
          { label: 'Сумма скидок', value: `${stats.totalDiscounts.toLocaleString('ru-RU')} ₽`, color: 'orange' },
          { label: 'Начислено бонусов', value: `${stats.totalBonusesAccrued.toLocaleString('ru-RU')} ₽`, color: 'purple' },
        ].map((item) => (
          <Card key={item.label} className={`border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${item.top ? 'border-t-4 border-t-blue-500' : ''}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{loading ? '—' : item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Заказов', value: stats.totalOrders.toString(), color: 'green', top: true },
          { label: 'Гостей', value: stats.totalGuests.toString(), color: 'green' },
          { label: 'Средний чек по заказу', value: `${stats.avgCheck.toLocaleString('ru-RU')} ₽`, color: 'green' },
          { label: 'Средний чек по гостю', value: `${stats.avgCheckPerGuest.toLocaleString('ru-RU')} ₽`, color: 'green' },
          { label: 'Маржа', value: `${stats.totalMargin.toLocaleString('ru-RU')} ₽`, color: 'orange' },
          { label: 'Фудкост', value: `${stats.foodCostPercent}%`, color: 'orange' },
        ].map((item) => (
          <Card key={item.label} className={`border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${item.top ? 'border-t-4 border-t-green-500' : ''}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{loading ? '—' : item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Ожидается продаж', value: stats.pendingOrders.toString(), color: 'orange', top: true },
          { label: 'Открыто заказов', value: stats.openOrders.toString(), color: 'green' },
          { label: 'Занято столов', value: stats.occupiedTables.toString(), color: 'orange' },
          { label: 'Занято мест', value: stats.occupiedSeats.toString(), color: 'green' },
          { label: 'Открыто смен', value: stats.openShifts.toString(), color: 'blue' },
          { label: 'Всего смен', value: stats.totalShifts.toString(), color: 'blue' },
        ].map((item) => (
          <Card key={item.label} className={`border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${item.top ? 'border-t-4 border-t-orange-500' : ''}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{loading ? '—' : item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              Продажи
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Продажи</span>
              <span className="font-bold text-foreground">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Наличные</span>
              <span className="font-medium text-foreground">{stats.totalPaymentsCash.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Безналичные</span>
              <span className="font-medium text-foreground">{stats.totalPaymentsCard.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400" />
                Тинькофф
              </span>
              <span className="font-medium text-foreground">{(stats.totalPaymentsCard * 0.6).toLocaleString('ru-RU')} ₽</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              Продажи по гостям
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              { name: 'Кошкина Кристина', total: 176560 },
              { name: 'Макаров Антон', total: 164452 },
              { name: 'Петров Сергей', total: 98230 },
            ].map((guest) => (
              <div key={guest.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{guest.name}</span>
                  <span className="font-medium text-foreground">{guest.total.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(guest.total / stats.totalRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            Ожидаемые заказы
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3 pt-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex p-4 rounded-full bg-muted/50 mb-3">
                <ClipboardList className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">Нет ожидаемых заказов</p>
            </div>
          ) : (
            <div className="space-y-2 pt-4">
              {orders.map((order) => (
                <div key={order.id} className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/50 hover:to-muted/30 transition-all duration-300 border border-transparent hover:border-border">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-bold text-white">#{order.table?.number || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">Стол {order.table?.number || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{order.waiter?.fullName || 'Неизвестно'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(order.createdAt), 'HH:mm')}
                      <span>•</span>
                      <span className="font-medium text-foreground">{Number(order.total).toFixed(0)} ₽</span>
                    </div>
                  </div>
                  <Badge className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 shadow-sm bg-orange-100 text-orange-700">
                    <Clock className="w-3.5 h-3.5" />
                    {order.status === 'NEW' ? 'Новый' : order.status === 'COOKING' ? 'Готовится' : 'Готов'}
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
