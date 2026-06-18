'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket-context';
import { cn } from '@/lib/utils';
import { Clock, ChefHat, CheckCircle2, Hand, Package, X } from 'lucide-react';
import { format } from 'date-fns';

export default function QueuePage() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?status=IN_QUEUE`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:created', () => fetchOrders());
    socket.on('order:updated', () => fetchOrders());
    return () => { socket.off('order:created'); socket.off('order:updated'); };
  }, [socket, fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const statusFlow = (status: string) => {
    switch (status) {
      case 'IN_QUEUE': return 'COOKING';
      case 'COOKING': return 'READY_FOR_PICKUP';
      case 'READY_FOR_PICKUP': return 'HANDED_OUT';
      default: return 'COMPLETED';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'IN_QUEUE': return <Clock className="w-4 h-4" />;
      case 'COOKING': return <ChefHat className="w-4 h-4" />;
      case 'READY_FOR_PICKUP': return <Package className="w-4 h-4" />;
      case 'HANDED_OUT': return <CheckCircle2 className="w-4 h-4" />;
      default: return <X className="w-4 h-4" />;
    }
  };

  const statusLabels: Record<string, string> = {
    IN_QUEUE: 'В очереди',
    COOKING: 'Готовится',
    READY_FOR_PICKUP: 'Готов к выдаче',
    HANDED_OUT: 'Выдан',
  };

  const statusColors: Record<string, string> = {
    IN_QUEUE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    COOKING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    READY_FOR_PICKUP: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    HANDED_OUT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">#{order.id.slice(-4).toUpperCase()}</span>
              <Badge className={cn('text-xs', statusColors[order.status])}>
                {statusIcon(order.status)}
                <span className="ml-1">{statusLabels[order.status] || order.status}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.createdAt), 'HH:mm')} — {order.waiter?.fullName || 'Касса'}
            </p>
          </div>
          <span className="text-lg font-bold">{Number(order.total).toFixed(0)} ₽</span>
        </div>

        <div className="space-y-1 mb-3">
                        {order.items?.map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.menuItem?.name || 'Блюдо'} × {item.quantity}
              </span>
              <span className="font-medium">{(item.unitPrice * item.quantity).toFixed(0)} ₽</span>
            </div>
          ))}
        </div>

        {order.status !== 'HANDED_OUT' && (
          <Button
            className="w-full"
            size="sm"
            onClick={() => updateStatus(order.id, statusFlow(order.status))}
          >
            {order.status === 'IN_QUEUE' && <ChefHat className="w-4 h-4 mr-1" />}
            {order.status === 'COOKING' && <Package className="w-4 h-4 mr-1" />}
            {order.status === 'READY_FOR_PICKUP' && <Hand className="w-4 h-4 mr-1" />}
            {order.status === 'IN_QUEUE' ? 'Начать готовить' :
             order.status === 'COOKING' ? 'Готов к выдаче' :
             order.status === 'READY_FOR_PICKUP' ? 'Выдать заказ' : 'Завершить'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Управление очередью</h1>
        <p className="text-sm text-muted-foreground">Отслеживание и выдача заказов</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Очередь пуста</p>
          <p className="text-sm">Новые заказы появятся здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(renderOrderCard)}
        </div>
      )}
    </div>
  );
}
