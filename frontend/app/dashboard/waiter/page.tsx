'use client';

import { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, ShoppingCart, Plus, Minus, Trash2,
  Table as TableIcon, Utensils, Send,
} from 'lucide-react';

// типы
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function WaiterPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function getToken() {
    return localStorage.getItem('token');
  }

  async function loadData() {
    try {
      const token = getToken();
      const [cat, items, tbls] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL + '/menu/categories', {
          headers: { Authorization: 'Bearer ' + token },
        }),
        fetch(process.env.NEXT_PUBLIC_API_URL + '/menu/items', {
          headers: { Authorization: 'Bearer ' + token },
        }),
        fetch(process.env.NEXT_PUBLIC_API_URL + '/tables', {
          headers: { Authorization: 'Bearer ' + token },
        }),
      ]);

      if (cat.ok) setCategories(await cat.json());
      if (items.ok) setMenuItems(await items.json());
      if (tbls.ok) setTables(await tbls.json());
    } catch (e) {
      console.log('Ошибка загрузки:', e);
    }
  }

  // фильтр
  function getFilteredItems() {
    let items = menuItems.filter(i => i.available);
    if (categoryId !== 'all') {
      items = items.filter(i => i.categoryId === categoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }

  function addToCart(item: MenuItem) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
    toast({ title: 'Добавлено', description: item.name });
  }

  function updateQty(id: string, delta: number) {
    setCart(cart.map(i => {
      if (i.id === id) {
        const q = i.quantity + delta;
        return q > 0 ? { ...i, quantity: q } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  }

  function removeItem(id: string) {
    setCart(cart.filter(i => i.id !== id));
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  async function sendOrder() {
    if (!tableId) {
      toast({ title: 'Ошибка', description: 'Выберите стол', variant: 'destructive' });
      return;
    }
    if (cart.length === 0) {
      toast({ title: 'Ошибка', description: 'Добавьте блюда', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + getToken(),
        },
        body: JSON.stringify({
          tableId: tableId,
          notes: notes,
          items: cart.map(i => ({
            menuItemId: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      if (res.ok) {
        toast({ title: 'Заказ отправлен!' });
        setCart([]);
        setNotes('');
        setTableId('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Ошибка');
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Ошибка', description: 'Не удалось отправить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* левая часть - меню */}
      <div className="flex-1 flex flex-col">
        {/* поиск и категории */}
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* сетка блюд */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getFilteredItems().map(item => (
              <Card key={item.id} className="cursor-pointer hover:shadow" onClick={() => addToCart(item)}>
                <CardContent className="p-3">
                  <div className="h-20 bg-muted rounded-lg flex items-center justify-center mb-2">
                    <Utensils className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">{item.price} ₽</span>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {getFilteredItems().length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                <Utensils className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>Ничего не найдено</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* правая часть - корзина */}
      <div className="w-80 border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Заказ {count > 0 && <Badge>{count}</Badge>}
          </h2>
        </div>

        <div className="p-4 border-b">
          <Label className="text-xs">Стол</Label>
          <Select value={tableId} onValueChange={setTableId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Выберите стол" />
            </SelectTrigger>
            <SelectContent>
              {tables.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  Стол {t.number} — {t.capacity} мест
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Корзина пуста</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.price} ₽</p>
                </div>
                <Button variant="outline" size="icon" className="w-6 h-6"
                  onClick={() => updateQty(item.id, -1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                <Button variant="outline" size="icon" className="w-6 h-6"
                  onClick={() => updateQty(item.id, 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive"
                  onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          <Textarea
            placeholder="Примечание..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Итого:</span>
            <span className="text-lg font-bold">{total} ₽</span>
          </div>
          <Button className="w-full" disabled={loading || cart.length === 0 || !tableId} onClick={sendOrder}>
            {loading ? 'Отправка...' : (
              <><Send className="w-4 h-4 mr-2" /> Отправить</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
