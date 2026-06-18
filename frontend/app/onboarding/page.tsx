'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ESTABLISHMENT_TYPES, EstablishmentType } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Store, ArrowRight, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, fetchUser } = useAuth();
  const [step, setStep] = useState<'type' | 'info'>('type');
  const [selectedType, setSelectedType] = useState<EstablishmentType | null>(null);
  const [establishmentName, setEstablishmentName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user?.establishmentId) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  async function handleCreateEstablishment() {
    if (!selectedType || !establishmentName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/establishments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: establishmentName.trim(),
          type: selectedType,
        }),
      });

      if (response.ok) {
        toast({ title: 'Заведение создано!', description: 'Добро пожаловать в RestaurantOS' });
        await fetchUser();
        router.replace('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось создать заведение');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedConfig = ESTABLISHMENT_TYPES.find((t) => t.value === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Добро пожаловать в RestaurantOS!</h1>
          <p className="text-muted-foreground mt-2">
            Давайте настроим ваше заведение. Выберите тип, который подходит вам.
          </p>
        </div>

        {step === 'type' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ESTABLISHMENT_TYPES.map((type) => {
                const isSelected = selectedType === type.value;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(type.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isSelected ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">{type.label}</h3>
                          {isSelected && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{type.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                disabled={!selectedType}
                onClick={() => setStep('info')}
              >
                Продолжить
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="text-3xl">{selectedConfig?.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Выбранный тип</p>
                    <p className="font-semibold text-lg">{selectedConfig?.label}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setStep('type')}
                  >
                    Изменить
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Название заведения</Label>
                  <Input
                    id="name"
                    placeholder={
                      selectedType === 'RESTAURANT' ? 'Ресторан «Гастроном»' :
                      selectedType === 'CAFE' ? 'Кафе «Уют»' :
                      selectedType === 'CANTEEN' ? 'Столовая №5' :
                      selectedType === 'COFFEE_SHOP' ? 'Кофейня «Аромат»' :
                      selectedType === 'BAKERY' ? 'Пекарня «Свежий хлеб»' :
                      selectedType === 'FAST_FOOD' ? 'Бургерная «Уголок»' :
                      selectedType === 'PUB' ? 'Паб «Пенное»' :
                      'Моё заведение'
                    }
                    value={establishmentName}
                    onChange={(e) => setEstablishmentName(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <Button
                  className="w-full h-12 text-base"
                  disabled={!establishmentName.trim() || saving}
                  onClick={handleCreateEstablishment}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Создание...
                    </span>
                  ) : (
                    'Создать заведение и начать работу'
                  )}
                </Button>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              Шаг 2 из 2 — Настройте ваше заведение
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
