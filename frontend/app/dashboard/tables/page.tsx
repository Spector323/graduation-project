'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/lib/socket-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as TableIcon, Plus, Edit2 } from 'lucide-react';

const STATUS_COLORS = {
  FREE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200',
  RESERVED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200',
  OCCUPIED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

const STATUS_LABELS = {
  FREE: 'Свободен',
  RESERVED: 'Забронирован',
  OCCUPIED: 'Занят',
};

export default function TablesPage() {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4',
    location: '',
    status: 'FREE',
  });

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить столы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (!socket) return;

    socket.on('table:created', () => { fetchTables(); });
    socket.on('table:updated', () => { fetchTables(); });
    socket.on('table:deleted', () => { fetchTables(); });

    return () => {
      socket.off('table:created');
      socket.off('table:updated');
      socket.off('table:deleted');
    };
  }, [socket, fetchTables]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingTable
        ? `${process.env.NEXT_PUBLIC_API_URL}/tables/${editingTable.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/tables`;
      const method = editingTable ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          number: parseInt(formData.number),
          capacity: parseInt(formData.capacity),
          location: formData.location,
          status: formData.status,
        }),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: `Стол ${editingTable ? 'обновлён' : 'создан'}` });
        setDialogOpen(false);
        resetForm();
        fetchTables();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить стол', variant: 'destructive' });
    }
  }

  function resetForm() {
    setFormData({ number: '', capacity: '4', location: '', status: 'FREE' });
    setEditingTable(null);
  }

  function handleEdit(table: Table) {
    setEditingTable(table);
    setFormData({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      location: table.location,
      status: table.status,
    });
    setDialogOpen(true);
  }

  async function deleteTable(id: string) {
    if (!confirm('Удалить этот стол?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Стол удалён' });
        fetchTables();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить стол', variant: 'destructive' });
    }
  }

  const stats = {
    total: tables.length,
    free: tables.filter((t) => t.status === 'FREE').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Столы</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление столами ресторана
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.free}</p>
            <p className="text-sm text-muted-foreground">Свободно</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
            <p className="text-sm text-muted-foreground">Забронировано</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
            <p className="text-sm text-muted-foreground">Занято</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer hover:shadow-lg transition-all border-2 ${STATUS_COLORS[table.status]}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    <span className="text-lg font-bold">Стол {table.number}</span>
                  </div>
                  <Badge className={STATUS_COLORS[table.status]}>
                    {STATUS_LABELS[table.status]}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Вместимость: {table.capacity} чел.</p>
                  <p>Расположение: {table.location || 'Н/Д'}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(table)}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    Редактировать
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteTable(table.id)}>
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Редактировать стол' : 'Добавить стол'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Номер стола</Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Вместимость</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Расположение</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="например, Окно, Терраса, Сад"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Свободен</SelectItem>
                  <SelectItem value="RESERVED">Забронирован</SelectItem>
                  <SelectItem value="OCCUPIED">Занят</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              {editingTable ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
