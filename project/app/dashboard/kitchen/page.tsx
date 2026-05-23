'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  NEW: { label: 'Новый', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COOKING: { label: 'Готовится', icon: ChefHat, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  READY: { label: 'Готов', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

export default function KitchenPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?status=NEW&status=COOKING&status=READY`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: `Заказ: ${status.toLowerCase()}` });
        fetchOrders();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить заказ', variant: 'destructive' });
    }
  }

  const getOrderTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return minutes;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Kitchen Display
          </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Активные заказы на кухне • Автообновление каждые 30с
        </p>
      </div>
      <Button onClick={fetchOrders} variant="outline">
        Обновить
      </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Orders</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === 'NEW').length}</p>
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
                <p className="text-sm text-muted-foreground">Cooking</p>
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
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === 'READY').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
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
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.NEW;

            return (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${statusConfig.color} flex items-center justify-center`}>
                        <statusConfig.icon className="w-4 h-4 text-white" />
                      </div>
      <div>
        <h1 className="text-2xl font-bold">Кухня</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление заказами на кухне
        </p>
      </div>
                    </div>
                    <Badge className={`${statusConfig.color} border`}>
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
                        <span className="font-semibold">Note:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {order.status === 'NEW' && (
                      <Button
                        className="flex-1"
                        onClick={() => updateStatus(order.id, 'COOKING')}
                      >
                        Начать готовить
                      </Button>
                    )}
                    {order.status === 'COOKING' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, 'READY')}
                      >
                        Готово
                      </Button>
                    )}
                  </div>
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
