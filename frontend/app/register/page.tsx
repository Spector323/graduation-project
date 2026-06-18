'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ESTABLISHMENT_TYPES, EstablishmentType } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Store, UtensilsCrossed, Eye, EyeOff, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [step, setStep] = useState<'account' | 'establishment'>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('WAITER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [establishmentName, setEstablishmentName] = useState('');
  const [establishmentType, setEstablishmentType] = useState<EstablishmentType | null>(null);
  const [platformMode, setPlatformMode] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({
        email,
        password,
        fullName,
        role: platformMode ? 'PLATFORM_OWNER' : role.toUpperCase(),
        establishmentName: platformMode ? undefined : (establishmentName.trim() || undefined),
        establishmentType: platformMode ? undefined : (establishmentType || undefined),
      });
      toast({ title: 'Аккаунт создан!', description: 'Добро пожаловать в RestaurantOS.' });
      router.replace('/dashboard');
    } catch (error: any) {
      toast({ title: 'Ошибка регистрации', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 to-amber-500 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border-4 border-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Присоединяйтесь к RestaurantOS</h1>
          <p className="text-orange-100 text-lg max-w-sm leading-relaxed">
            Единая система управления для ресторанов, кафе, столовых и любого общепита.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: '🍽️', text: 'Управление столами и бронированием' },
              { icon: '📋', text: 'Создание и отслеживание заказов' },
              { icon: '👨‍🍳', text: 'Кухонный дисплей для поваров' },
              { icon: '📊', text: 'Аналитика и статистика' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">RestaurantOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Создать аккаунт</h2>
            <p className="text-muted-foreground mt-2">
              {step === 'account' ? 'Начните работу с RestaurantOS' : 'Укажите информацию о заведении'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'account' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            }`}>1</div>
            <div className="h-0.5 flex-1 bg-border" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'establishment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>2</div>
          </div>

          {step === 'account' ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep('establishment'); }} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">ФИО</Label>
                <Input
                  id="fullName"
                  placeholder="Иванов Иван"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
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
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Администратор — Полный доступ</SelectItem>
                    <SelectItem value="MANAGER">Менеджер — Управление</SelectItem>
                    <SelectItem value="WAITER">Официант — Заказы и столы</SelectItem>
                    <SelectItem value="COOK">Повар — Кухня</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">или</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={() => { setPlatformMode(!platformMode); setStep(platformMode ? 'account' : 'establishment'); }}
              >
                {platformMode ? 'Обычная регистрация заведения' : 'Регистрация владельца платформы'}
              </Button>
              {platformMode && (
                <div className="space-y-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Режим владельца платформы — полный доступ ко всем заведениям и настройкам системы
                  </p>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base gradient-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Создание...' : 'Создать аккаунт владельца платформы'}
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label>Тип заведения</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ESTABLISHMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        establishmentType === type.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setEstablishmentType(type.value)}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{type.label}</p>
                      </div>
                      {establishmentType === type.value && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estName">Название заведения (необязательно)</Label>
                <Input
                  id="estName"
                  placeholder="Название вашего заведения"
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Можно указать позже при первом входе
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('account')}
                >
                  Назад
                </Button>
                <Button type="submit" className="flex-1 h-11 text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Создание...
                    </span>
                  ) : 'Создать аккаунт'}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
