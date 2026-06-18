'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ArrowLeft, Delete, Building2 } from 'lucide-react';

interface Establishment {
  id: string;
  name: string;
  type: string;
  address: string;
}

export default function PinLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signInWithPin } = useAuth();

  const [step, setStep] = useState<'select' | 'pin'>('select');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/establishments`)
      .then(r => r.json())
      .then(data => setEstablishments(data))
      .catch(() => toast({ title: 'Ошибка', description: 'Не удалось загрузить заведения', variant: 'destructive' }));
  }, []);

  const handleNumberClick = (num: number) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      toast({
        title: 'Ошибка',
        description: 'PIN-код должен содержать минимум 4 цифры',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEstablishment) {
      toast({
        title: 'Ошибка',
        description: 'Выберите заведение',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithPin(pin, selectedEstablishment.id);
      toast({ title: 'Вход выполнен!', description: 'Добро пожаловать.' });
      router.replace('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Ошибка входа',
        description: error.message || 'Неверный PIN-код',
        variant: 'destructive',
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-orange-600 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white" />
            <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border-4 border-white" />
          </div>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Выберите заведение</h1>
            <p className="text-orange-100 text-lg max-w-sm leading-relaxed">
              Выберите заведение, к которому привязан ваш PIN-код
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <Button variant="ghost" onClick={() => router.push('/login')} className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад к входу
            </Button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">Вход в систему</h2>
              <p className="text-muted-foreground mt-2">Выберите заведение для входа</p>
            </div>

            <div className="space-y-3">
              {establishments.map((est) => (
                <Card
                  key={est.id}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 border-border"
                  onClick={() => {
                    setSelectedEstablishment(est);
                    setStep('pin');
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{est.name}</h3>
                      <p className="text-sm text-muted-foreground">{est.type} • {est.address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-orange-600 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border-4 border-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <KeyRound className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Вход по PIN-коду</h1>
          <p className="text-orange-100 text-lg max-w-sm leading-relaxed">
            {selectedEstablishment?.name}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Button variant="ghost" onClick={() => setStep('select')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">PIN-код</h2>
            <p className="text-muted-foreground mt-2">
              Введите PIN для {selectedEstablishment?.name}
            </p>
          </div>

          <Card className="border border-border shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Ввод PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                      index < pin.length
                        ? 'border-primary bg-primary text-primary-foreground scale-110'
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    {index < pin.length && (
                      <div className="w-3 h-3 rounded-full bg-current" />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant="outline"
                    className="h-16 text-2xl font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                    onClick={() => handleNumberClick(num)}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-16 text-xl"
                  onClick={handleDelete}
                >
                  <Delete className="w-6 h-6" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 text-2xl font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  onClick={() => handleNumberClick(0)}
                >
                  0
                </Button>
                <Button
                  type="button"
                  className="h-16 text-xl font-semibold gradient-primary"
                  onClick={handleSubmit}
                  disabled={loading || pin.length < 4}
                >
                  {loading ? 'Вход...' : 'Войти'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
                Войти с паролем
              </Button>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Нет PIN-кода?{' '}
            <span className="text-primary font-medium">Обратитесь к администратору</span>
          </p>
        </div>
      </div>
    </div>
  );
}
