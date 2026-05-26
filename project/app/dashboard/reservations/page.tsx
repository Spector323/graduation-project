'use client';

import { useState, useEffect } from 'react';
import { Reservation, Table } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Plus, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function ReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservedAt: '',
    partySize: '2',
    tableId: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resRes, tablesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (resRes.ok) setReservations(await resRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          reservedAt: formData.reservedAt,
          partySize: parseInt(formData.partySize),
          tableId: formData.tableId || null,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Бронирование создано' });
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reservation');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: `Бронирование ${status === 'CONFIRMED' ? 'подтверждено' : status === 'CANCELLED' ? 'отменено' : 'завершено'}` });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить бронирование', variant: 'destructive' });
    }
  }

  function resetForm() {
    setFormData({
      customerName: '',
      customerPhone: '',
      reservedAt: '',
      partySize: '2',
      tableId: '',
      notes: '',
    });
  }

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    today: reservations.filter((r) => {
      const resDate = new Date(r.reservedAt);
      const today = new Date();
      return resDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Бронирование</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление бронированием столов
        </p>
      </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Новая бронь
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Ожидает</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Подтверждено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Сегодня</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{reservation.customerName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {reservation.customerPhone || 'Нет телефона'}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(reservation.reservedAt), 'MMM d, yyyy HH:mm')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {reservation.partySize} {reservation.partySize === 1 ? 'гость' : 'гостей'}
                          </span>
                          {reservation.table && (
                            <span className="text-xs text-muted-foreground">
                              Стол {reservation.table.number}
                            </span>
                          )}
                        </div>
                        {reservation.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{reservation.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS]}>
                        {reservation.status}
                      </Badge>
                      <div className="flex gap-1">
                        {reservation.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(reservation.id, 'CONFIRMED')}
                            >
                              Подтвердить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(reservation.id, 'CANCELLED')}
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {reservation.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(reservation.id, 'COMPLETED')}
                          >
                            Завершить
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {reservations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">Нет бронирований</p>
                  <p className="text-sm">Создайте первое бронирование</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать бронирование</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Имя клиента</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Номер телефона</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservedAt">Дата и время</Label>
                <Input
                  id="reservedAt"
                  type="datetime-local"
                  value={formData.reservedAt}
                  onChange={(e) => setFormData({ ...formData, reservedAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partySize">Количество гостей</Label>
                <Select
                  value={formData.partySize}
                  onValueChange={(value) => setFormData({ ...formData, partySize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'гость' : 'гостей'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Стол (необязательно)</Label>
              <Select
                value={formData.tableId}
                onValueChange={(value) => setFormData({ ...formData, tableId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без конкретного стола" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Стол {table.number} ({table.capacity} мест)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Примечание</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Особые пожелания, аллергии..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Создать бронирование
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
