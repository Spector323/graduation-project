'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Trash2, Edit3, DollarSign, Users } from 'lucide-react';
import { ESTABLISHMENT_TYPES } from '@/lib/api-client';

export default function PlatformEstablishmentsPage() {
  const { toast } = useToast();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'RESTAURANT', address: '', phone: '', adminEmail: '', adminPassword: '', adminName: '' });

  const fetchEstablishments = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/establishments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEstablishments(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEstablishments(); }, []);

  const createEstablishment = async () => {
    if (!form.name || !form.adminEmail || !form.adminPassword || !form.adminName) {
      toast({ title: 'Ошибка', description: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/establishments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast({ title: 'Успешно', description: 'Заведение создано' });
      setCreateOpen(false);
      setForm({ name: '', type: 'RESTAURANT', address: '', phone: '', adminEmail: '', adminPassword: '', adminName: '' });
      fetchEstablishments();
    } else {
      const err = await res.json();
      toast({ title: 'Ошибка', description: err.error, variant: 'destructive' });
    }
  };

  const deleteEstablishment = async (id: string, name: string) => {
    if (!confirm(`Удалить заведение "${name}" и все связанные данные?`)) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/establishments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      toast({ title: 'Удалено', description: `Заведение "${name}" удалено` });
      fetchEstablishments();
    } else {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Управление заведениями
          </h1>
          <p className="text-sm text-muted-foreground">Создание и управление всеми заведениями платформы</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новое заведение</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Мой Ресторан" />
                </div>
                <div className="space-y-2">
                  <Label>Тип *</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESTABLISHMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Адрес</Label>
                  <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="ул. Пушкина, 1" />
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 (999) 123-45-67" />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">Администратор заведения</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Имя *</Label>
                    <Input value={form.adminName} onChange={e => setForm(p => ({ ...p, adminName: e.target.value }))} placeholder="Иван Иванов" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input value={form.adminEmail} onChange={e => setForm(p => ({ ...p, adminEmail: e.target.value }))} placeholder="admin@example.com" />
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <Label>Пароль *</Label>
                  <Input type="password" value={form.adminPassword} onChange={e => setForm(p => ({ ...p, adminPassword: e.target.value }))} placeholder="Минимум 6 символов" />
                </div>
              </div>
              <Button className="w-full" onClick={createEstablishment}>Создать заведение</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {establishments.map((est: any) => (
            <Card key={est.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{est.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5">{est.type}</Badge>
                        <span>{est.address || 'адрес не указан'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{est._count?.users || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{(est.totalRevenue || 0).toFixed(0)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteEstablishment(est.id, est.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {establishments.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Нет заведений</p>
              <p className="text-sm">Создайте первое заведение</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
