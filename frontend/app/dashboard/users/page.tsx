 'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { User } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Eye, Edit2, Trash2, User as UserIcon, KeyRound } from 'lucide-react';
import SetPinDialog from './set-pin-dialog';

const ROLES = [
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'WAITER', label: 'Официант' },
  { value: 'COOK', label: 'Повар' },
];

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'WAITER',
    active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Не удалось загрузить сотрудников:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить сотрудников', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const body = editingUser
        ? { fullName: formData.fullName, role: formData.role, active: formData.active }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: `Сотрудник ${editingUser ? 'обновлён' : 'создан'}`,
        });
        setDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить этого сотрудника?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Сотрудник удалён' });
        fetchUsers();
      }
    } catch (error) {
        toast({ title: 'Ошибка', description: 'Не удалось удалить сотрудника', variant: 'destructive' });
    }
  }

  function resetForm() {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'WAITER',
      active: true,
    });
    setEditingUser(null);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    });
    setDialogOpen(true);
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'COOK': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Сотрудники</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление персоналом ресторана
        </p>
      </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Редактировать' : 'Новый сотрудник'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
              <Label htmlFor="fullName">ФИО</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иван Петров"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivan@restaurant.com"
                required
                disabled={editingUser !== null}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Администратор</SelectItem>
                  <SelectItem value="MANAGER">Менеджер</SelectItem>
                  <SelectItem value="WAITER">Официант</SelectItem>
                  <SelectItem value="COOK">Повар</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">Активен</Label>
            </div>
              <Button type="submit" className="w-full">
                {editingUser ? 'Сохранить' : 'Добавить'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Имя</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Роль</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">PIN-код</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Статус</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role === 'ADMIN' ? 'Админ' : user.role === 'MANAGER' ? 'Менеджер' : user.role === 'WAITER' ? 'Официант' : 'Повар'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.hasPin ? (
                          <div className="group relative">
                            <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded cursor-help">••••</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SetPinDialog userId={user.id} userName={user.fullName} hasPin={!!user.hasPin} onSuccess={fetchUsers} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
