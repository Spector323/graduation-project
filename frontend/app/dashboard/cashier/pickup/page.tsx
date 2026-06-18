'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket-context';
import { cn } from '@/lib/utils';
import { Package, Hand, Clock, ChefHat, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function PickupPage() {
  const { socket } = useSocket();
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState(false);

  const fetchReadyOrders = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?status=READY_FOR_PICKUP`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setReadyOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadyOrders(); }, [fetchReadyOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:updated', (order: Order) => {
      if (order.status === 'READY_FOR_PICKUP') {
        fetchReadyOrders();
        if (!notified) {
          setNotified(true);
          setTimeout(() => setNotified(false), 5000);
        }
      }
    });
    return () => { socket.off('order:updated'); };
  }, [socket, fetchReadyOrders, notified]);

  const handOut = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'HANDED_OUT' }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Выдача заказов</h1>
          <p className="text-sm text-muted-foreground">
            {readyOrders.length} {readyOrders.length === 1 ? 'заказ готов' : readyOrders.length < 5 ? 'заказа готово' : 'заказов готово'} к выдаче
          </p>
        </div>
        {notified && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg animate-pulse">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">Новый заказ готов!</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : readyOrders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Нет готовых заказов</p>
          <p className="text-sm">Заказы, готовые к выдаче, появятся здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readyOrders.map(order => (
            <Card key={order.id} className={cn(
              'border-2 transition-all',
              'border-green-200 dark:border-green-800 shadow-md'
            )}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">#{order.id.slice(-4).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{Number(order.total).toFixed(0)} ₽</span>
                </div>
                <div className="space-y-1 mb-4">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.menuItem?.name || 'Блюдо'} × {item.quantity}
                      </span>
                      <span>{(item.unitPrice * item.quantity).toFixed(0)} ₽</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full h-11 text-base font-semibold"
                  onClick={() => handOut(order.id)}
                >
                  <Hand className="w-4 h-4 mr-2" />
                  Выдать заказ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
