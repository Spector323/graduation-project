'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/lib/socket-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Clock, ChefHat, CheckCircle2, AlertCircle, Package, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  NEW: { label: 'Новый', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  PAID: { label: 'Оплачен', icon: CreditCard, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  IN_QUEUE: { label: 'В очереди', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  COOKING: { label: 'Готовится', icon: ChefHat, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  READY: { label: 'Готов', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  READY_FOR_PICKUP: { label: 'К выдаче', icon: Package, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  HANDED_OUT: { label: 'Выдан', icon: Package, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  COMPLETED: { label: 'Завершён', icon: CheckCircle2, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  CANCELLED: { label: 'Отменён', icon: AlertCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const TAB_STATUSES = ['all', 'NEW', 'PAID', 'IN_QUEUE', 'COOKING', 'READY', 'READY_FOR_PICKUP', 'COMPLETED'];

export default function OrdersPage() {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить заказы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:created', () => { fetchOrders(); });
    socket.on('order:updated', () => { fetchOrders(); });
    return () => { socket.off('order:created'); socket.off('order:updated'); };
  }, [socket, fetchOrders]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast({ title: 'Успешно', description: `Статус изменён на "${STATUS_CONFIG[status]?.label || status}"` });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить заказ', variant: 'destructive' });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Заказы</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление и отслеживание всех заказов
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="NEW">Новые</TabsTrigger>
          <TabsTrigger value="COOKING">Готовятся</TabsTrigger>
          <TabsTrigger value="READY">Готовы</TabsTrigger>
          <TabsTrigger value="COMPLETED">Завершены</TabsTrigger>
        </TabsList>

        {TAB_STATUSES.map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {orders
                      .filter((order) => tab === 'all' || order.status === tab)
                      .map((order) => (
                        <div key={order.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  #{order.id.slice(-4).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {order.table ? `Стол ${order.table.number}` : 'На вынос'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.waiter?.fullName || 'Касса'} • {format(new Date(order.createdAt), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            <Badge className={STATUS_CONFIG[order.status]?.color || ''}>
                              {STATUS_CONFIG[order.status]?.label || order.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-3">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {item.quantity}x {item.menuItem?.name || 'Позиция'}
                                </span>
                                <span className="font-medium">{item.unitPrice.toFixed(0)} ₽</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div>
                              <p className="text-sm text-muted-foreground">Итого</p>
                              <p className="text-xl font-bold">{order.total.toFixed(0)} ₽</p>
                              {order.paymentType && (
                                <p className="text-xs text-muted-foreground">
                                  Оплата: {order.paymentType === 'CASH' ? 'Наличные' : order.paymentType === 'CARD' ? 'Карта' : 'QR'}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {order.status === 'NEW' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'COOKING')}>
                                  Начать готовить
                                </Button>
                              )}
                              {order.status === 'COOKING' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'READY')}>
                                  Готово
                                </Button>
                              )}
                              {order.status === 'READY' && (
                                <Select onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}>
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Действие" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="COMPLETED">Завершить (оплачено)</SelectItem>
                                    <SelectItem value="READY_FOR_PICKUP">Готов к выдаче</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {order.status === 'READY_FOR_PICKUP' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'HANDED_OUT')}>
                                  Выдан
                                </Button>
                              )}
                              {order.status === 'PAID' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'COOKING')}>
                                  Начать готовить
                                </Button>
                              )}
                              {order.status === 'IN_QUEUE' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'COOKING')}>
                                  Начать готовить
                                </Button>
                              )}
                              {['NEW', 'PAID', 'IN_QUEUE'].includes(order.status) && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'CANCELLED')}>
                                  Отменить
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {orders.filter((order) => tab === 'all' || order.status === tab).length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p>Заказов не найдено</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
