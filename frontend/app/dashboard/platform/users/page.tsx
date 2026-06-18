'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const roleColors: Record<string, string> = {
    PLATFORM_OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    WAITER: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    COOK: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    CASHIER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  };

  const roleLabels: Record<string, string> = {
    PLATFORM_OWNER: 'Владелец',
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    WAITER: 'Официант',
    COOK: 'Повар',
    CASHIER: 'Кассир',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Все пользователи
        </h1>
        <p className="text-sm text-muted-foreground">{users.length} пользователей на платформе</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {user.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge className={roleColors[user.role] || ''}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  {user.establishment && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>{user.establishment.name}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground w-20 text-right">
                    {format(new Date(user.createdAt), 'dd.MM.yy')}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет пользователей</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
