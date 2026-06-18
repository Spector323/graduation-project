'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/lib/socket-context';
import { ChefHat, Clock, CheckCircle2, Package } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  NEW: { label: 'Новый', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  PAID: { label: 'Оплачен', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  IN_QUEUE: { label: 'В очереди', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  COOKING: { label: 'Готовится', icon: ChefHat, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  READY: { label: 'Готов', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  READY_FOR_PICKUP: { label: 'К выдаче', icon: Package, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

export default function KitchenPage() {
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
        const data: Order[] = await response.json();
        setOrders(data.filter((o: Order) =>
          ['NEW', 'PAID', 'IN_QUEUE', 'COOKING', 'READY', 'READY_FOR_PICKUP'].includes(o.status)
        ));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:created', (order: Order) => {
      if (['NEW', 'PAID', 'IN_QUEUE', 'COOKING', 'READY'].includes(order.status)) {
        setOrders((prev) => [order, ...prev]);
        toast({ title: 'Новый заказ!', description: `Заказ #${order.id.slice(-4).toUpperCase()}`, variant: 'default' });
      }
    });
    socket.on('order:updated', (updated: Order) => {
      setOrders((prev) => {
        const filtered = prev.filter((o) => o.id !== updated.id);
        if (['NEW', 'PAID', 'IN_QUEUE', 'COOKING', 'READY', 'READY_FOR_PICKUP'].includes(updated.status)) {
          return [updated, ...filtered];
        }
        return filtered;
      });
    });
    return () => { socket.off('order:created'); socket.off('order:updated'); };
  }, [socket, toast]);

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
        toast({ title: 'Успешно', description: `Статус обновлён на "${STATUS_CONFIG[status]?.label || status}"` });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить заказ', variant: 'destructive' });
    }
  }

  const getOrderTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  const nextStatus = (status: string): string | null => {
    if (status === 'NEW' || status === 'PAID' || status === 'IN_QUEUE') return 'COOKING';
    if (status === 'COOKING') return 'READY';
    return null;
  };

  const activeOrders = orders.filter(o => o.status === 'COOKING' || o.status === 'NEW' || o.status === 'PAID' || o.status === 'IN_QUEUE');
  const readyOrders = orders.filter(o => o.status === 'READY' || o.status === 'READY_FOR_PICKUP');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Кухня
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Активные заказы на кухне • {activeOrders.length} {activeOrders.length === 1 ? 'готовится' : 'готовятся'}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Новые / В очереди</p>
                <p className="text-2xl font-bold">{orders.filter((o) => ['NEW', 'PAID', 'IN_QUEUE'].includes(o.status)).length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Готовятся</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === 'COOKING').length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Готовы к выдаче</p>
                <p className="text-2xl font-bold">{readyOrders.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const minutes = getOrderTime(order.createdAt);
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;

            return (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{order.id.slice(-4).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {order.table ? `Стол ${order.table.number}` : 'На вынос'}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'HH:mm')}</p>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.color} border`}>
                      <statusConfig.icon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="flex-1 ml-3">{item.menuItem?.name}</span>
                        {item.notes && (
                          <span className="text-xs text-muted-foreground italic ml-2">({item.notes})</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Заметка:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {minutes > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      {minutes} {minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад
                    </p>
                  )}

                  {nextStatus(order.status) && (
                    <Button
                      className="w-full"
                      onClick={() => updateStatus(order.id, nextStatus(order.status) as OrderStatus)}
                    >
                      {order.status === 'COOKING' ? 'Готово' : 'Начать готовить'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Нет активных заказов</p>
              <p className="text-sm">Кухня свободна и готова к новым заказам</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
