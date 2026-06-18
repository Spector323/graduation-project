'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, DollarSign, Utensils, Clock, BarChart3,
  PieChart, CalendarDays, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (value: number) => `${value.toFixed(0)} ₽`;
const formatNumber = (value: number) => value.toLocaleString('ru-RU');

interface RevenueData { labels: string[]; data: number[]; total: number; period: string }
interface PopularItem { id: string; name: string; price: number; totalQuantity: number }
interface BusyHours { labels: string[]; data: number[] }

export default function AnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState('day');
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHours | null>(null);
  const [averageCheck, setAverageCheck] = useState<{ averageCheck: number; totalOrders: number; totalRevenue: number } | null>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [revRes, popRes, busyRes, avgRes, occRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/revenue?period=${revenuePeriod}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/popular-items?limit=8`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/busy-hours`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/average-check`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/occupancy`, { headers }),
      ]);

      if (revRes.ok) setRevenue(await revRes.json());
      if (popRes.ok) {
        const data = await popRes.json();
        setPopularItems(Array.isArray(data) ? data : []);
      }
      if (busyRes.ok) setBusyHours(await busyRes.json());
      if (avgRes.ok) setAverageCheck(await avgRes.json());
      if (occRes.ok) setOccupancy(await occRes.json());
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [revenuePeriod]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const revenueChartData = revenue?.labels.map((label, i) => ({
    name: label,
    value: revenue.data[i],
  })) || [];

  const popularChartData = Array.isArray(popularItems) ? popularItems.map(item => ({
    name: item.name,
    value: item.totalQuantity,
    revenue: item.totalQuantity * item.price,
  })) : [];

  const busyChartData = busyHours?.labels.map((label, i) => ({
    name: label,
    orders: busyHours.data[i],
  })) || [];

  const pieData = Array.isArray(popularItems) ? popularItems.slice(0, 6).map(item => ({
    name: item.name,
    value: item.totalQuantity,
  })) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Аналитика
        </h1>
        <p className="text-sm text-muted-foreground">Статистика и отчёты по заведению</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </>
        ) : (
          <>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/30">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Выручка ({revenuePeriod === 'day' ? 'сегодня' : revenuePeriod === 'week' ? 'неделя' : 'месяц'})</p>
                    <p className="text-xl font-bold">{revenue ? formatCurrency(revenue.total) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Средний чек</p>
                    <p className="text-xl font-bold">{averageCheck ? formatCurrency(averageCheck.averageCheck) : '—'}</p>
                    <p className="text-xs text-muted-foreground">{averageCheck?.totalOrders || 0} заказов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                    <Utensils className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Популярных блюд</p>
                    <p className="text-xl font-bold">{popularItems.length}</p>
                    <p className="text-xs text-muted-foreground">в топе</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Загрузка зала</p>
                    <p className="text-xl font-bold">{occupancy ? `${occupancy.occupancyRate.toFixed(0)}%` : '—'}</p>
                    <p className="text-xs text-muted-foreground">{occupancy?.occupiedTables || 0}/{occupancy?.totalTables || 0} столов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Выручка
              </CardTitle>
              <div className="flex gap-1">
                {['day', 'week', 'month'].map(p => (
                  <Button
                    key={p}
                    variant={revenuePeriod === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenuePeriod(p)}
                    className="h-8 text-xs"
                  >
                    {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${v} ₽`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Выручка']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Загруженность по часам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={busyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={2} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'Заказов']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              Популярные блюда
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <div className="space-y-3">
                {Array.isArray(popularItems) && popularItems.slice(0, 8).map((item, index) => {
                  const maxQty = Math.max(...popularItems.map(i => i.totalQuantity));
                  const barWidth = maxQty > 0 ? (item.totalQuantity / maxQty) * 100 : 0;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-5">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{item.name}</span>
                          <span className="font-medium ml-2">{item.totalQuantity}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Распределение заказов
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-64 w-64 rounded-full" />
            ) : pieData.length === 0 ? (
              <p className="text-muted-foreground py-16">Нет данных</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
