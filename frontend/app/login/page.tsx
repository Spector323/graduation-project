'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed, Eye, EyeOff, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      const token = localStorage.getItem('token');
      const estRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/establishments/current`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (estRes.ok) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка входа', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 to-orange-400 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border-4 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">RestaurantOS</h1>
          <p className="text-orange-100 text-lg max-w-sm leading-relaxed">
            Единая система управления для ресторанов, кафе, столовых и любого общепита.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Столы', value: 'Статус' },
              { label: 'Заказы', value: 'Онлайн' },
              { label: 'Персонал', value: 'По ролям' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-sm text-orange-200">{item.label}</div>
                <div className="font-semibold mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">RestaurantOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">С возвращением!</h2>
            <p className="text-muted-foreground mt-2">Войдите в свой аккаунт</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          <Button type="submit" className="w-full h-11 text-base gradient-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Вход...
              </span>
            ) : 'Войти'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">или</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 text-base"
          onClick={() => router.push('/pin-login')}
        >
          <KeyRound className="w-4 h-4 mr-2" />
          Вход по PIN-коду
        </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            У вас нет аккаунта?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Создать аккаунт
            </Link>
          </p>

          
        </div>
      </div>
    </div>
  );
}
