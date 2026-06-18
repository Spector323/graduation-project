'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { MenuItem, ESTABLISHMENT_CONFIGS } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { Minus, Trash2, Search, ShoppingCart, CreditCard, Banknote, QrCode, Plus } from 'lucide-react';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

export default function CashierPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartNotes, setCartNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  const config = user?.establishment?.type ? ESTABLISHMENT_CONFIGS[user.establishment.type as keyof typeof ESTABLISHMENT_CONFIGS] : null;
  const isQueueMode = config?.queueMode;
  const isInstantPayment = config?.instantPayment;

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/categories`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.filter((m: MenuItem) => m.available));
      }
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId !== menuItemId) return item;
      const newQty = item.quantity + delta;
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    if (isInstantPayment && !paymentMethod) return;

    setProcessing(true);
    try {
      const initialStatus = isQueueMode ? 'IN_QUEUE' : (isInstantPayment ? 'PAID' : 'NEW');
      const body: Record<string, unknown> = {
        items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, price: i.price, notes: i.notes })),
        notes: orderNote,
      };
      if (isInstantPayment) {
        body.paymentType = paymentMethod;
        body.status = initialStatus;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setCart([]);
        setOrderNote('');
        setPaymentMethod(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!config) {
    return <div className="p-6 text-center text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">POS — Касса</h1>
            <p className="text-sm text-muted-foreground">
              {isQueueMode ? 'Очередь заказов' : 'Приём и оплата заказов'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск блюд..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Всё меню
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-2">{Number(item.price).toFixed(0)} ₽</p>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Ничего не найдено</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-96 flex flex-col">
        <Card className="flex-1 flex flex-col border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Заказ
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {cartItems} {cartItems === 1 ? 'позиция' : cartItems < 5 ? 'позиции' : 'позиций'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-3 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Корзина пуста</p>
                <p className="text-xs">Нажмите на блюдо, чтобы добавить</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{Number(item.price).toFixed(0)} ₽ × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.menuItemId, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.menuItemId, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.menuItemId)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {cart.length > 0 && (
            <div className="p-3 border-t border-border space-y-3">
              {isInstantPayment && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Способ оплаты</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CASH')}
                      className="h-10"
                    >
                      <Banknote className="w-4 h-4 mr-1" />
                      Наличные
                    </Button>
                    <Button
                      variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CARD')}
                      className="h-10"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Карта
                    </Button>
                    <Button
                      variant={paymentMethod === 'QR' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('QR')}
                      className="h-10"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Итого:</span>
                <span className="text-xl font-bold">{cartTotal.toFixed(0)} ₽</span>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={submitOrder}
                disabled={processing || (isInstantPayment && !paymentMethod)}
              >
                {processing ? 'Оформление...' : isQueueMode ? 'Поставить в очередь' : 'Оплатить и отправить'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
