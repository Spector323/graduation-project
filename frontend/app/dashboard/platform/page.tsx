'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ClipboardList, DollarSign, Activity, TableIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PlatformStats {
  totalEstablishments: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  totalTables: number;
}

export default function PlatformPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [establishments, setEstablishments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [statsRes, estRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/establishments`, { headers }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (estRes.ok) setEstablishments(await estRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Заведений', value: stats?.totalEstablishments, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Пользователей', value: stats?.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Всего заказов', value: stats?.totalOrders, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Выручка', value: `${(stats?.totalRevenue || 0).toFixed(0)} ₽`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Активных заказов', value: stats?.activeOrders, icon: Activity, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Столов', value: stats?.totalTables, icon: TableIcon, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Платформа — Панель управления</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : statCards.map((card) => (
              <Card key={card.label} className="border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold mt-1">{card.value ?? '—'}</p>
                    </div>
                    <div className={card.bg + ' p-2.5 rounded-xl'}>
                      <card.icon className={card.color + ' w-5 h-5'} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Заведения
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {establishments.map((est: any) => (
                <div key={est.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{est.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {est.type} — {est._count?.users || 0} {((est._count?.users || 0) === 1) ? 'сотрудник' : 'сотрудников'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{(est.totalRevenue || 0).toFixed(0)} ₽</p>
                    <p className="text-xs text-muted-foreground">{est.orderCount || 0} заказов</p>
                  </div>
                </div>
              ))}
              {establishments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Нет заведений</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
