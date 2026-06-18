'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Activity, RotateCw, UserCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  DELETE: 'Удаление',
  REGISTER: 'Регистрация',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  REGISTER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const ENTITY_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  ORDER: 'Заказ',
  ORDER_STATUS: 'Статус заказа',
  TABLE: 'Стол',
  MENU_ITEM: 'Блюдо',
  MENU_CATEGORY: 'Категория',
  RESERVATION: 'Бронь',
  ESTABLISHMENT: 'Заведение',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const params = new URLSearchParams();
    if (entityFilter !== 'all') params.set('entity', entityFilter);
    if (actionFilter !== 'all') params.set('action', actionFilter);

    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit?${params}&limit=100`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/stats`, { headers }),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [entityFilter, actionFilter]);

  const statCards = stats ? [
    { label: 'Всего записей', value: stats.totalLogs, icon: History, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Созданий', value: stats.actionCounts?.find((a: any) => a.action === 'CREATE')?.count || 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Изменений', value: stats.actionCounts?.find((a: any) => a.action === 'UPDATE')?.count || 0, icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Удалений', value: stats.actionCounts?.find((a: any) => a.action === 'DELETE')?.count || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Журнал действий
          </h1>
          <p className="text-sm text-muted-foreground">Аудит всех операций в системе</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RotateCw className="w-4 h-4 mr-1" />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${card.bg} dark:opacity-80`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Сущность:</span>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Действие:</span>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет записей в журнале</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      log.action === 'CREATE' ? 'bg-green-500' :
                      log.action === 'UPDATE' ? 'bg-blue-500' :
                      log.action === 'DELETE' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${ACTION_COLORS[log.action] || ''}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                        <span className="text-xs font-medium">{ENTITY_LABELS[log.entity] || log.entity}</span>
                        {log.entityId && (
                          <span className="text-[10px] text-muted-foreground font-mono">#{log.entityId.slice(-6)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.userName || log.userEmail || 'Система'}
                        {' — '}
                        {format(new Date(log.createdAt), 'dd.MM.yy HH:mm:ss')}
                      </p>
                    </div>
                    {log.details && log.details !== '{}' && (
                      <div className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                        {Object.entries(JSON.parse(log.details || '{}')).filter(([k]) => k !== 'createdId').map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: {JSON.stringify(v).slice(0, 30)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
