'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fullName: profileData.fullName }),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Профиль обновлён' });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить профиль', variant: 'destructive' });
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Ошибка', description: 'Пароль должен быть не менее 6 символов', variant: 'destructive' });
      return;
    }

    try {
      // Note: You might want to create a separate endpoint for password change
      toast({ title: 'Успешно', description: 'Функция смены пароля скоро будет доступна' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить пароль', variant: 'destructive' });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление профилем и безопасностью
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Card className="md:col-span-1">
          <CardContent className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-accent text-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Профиль</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Уведомления</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Безопасность</span>
            </button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Информация о профиле
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">ФИО</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email нельзя изменить
                </p>
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <div className="px-3 py-2 bg-muted rounded-lg text-sm">
                  {user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'MANAGER' ? 'Менеджер' : user?.role === 'WAITER' ? 'Официант' : 'Повар'}
                </div>
              </div>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Смена пароля
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <Button type="submit">
              Обновить пароль
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            О приложении
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Версия</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Окружение</p>
              <p className="font-medium">Разработка</p>
            </div>
            <div>
              <p className="text-muted-foreground">Обновлено</p>
              <p className="font-medium">2026-05-20</p>
            </div>
            <div>
              <p className="text-muted-foreground">Статус</p>
              <p className="font-medium text-green-600">Активно</p>
            </div>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>RestaurantOS — Дипломный проект</p>
            <p>Built with Next.js, Express, PostgreSQL, and Prisma</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
