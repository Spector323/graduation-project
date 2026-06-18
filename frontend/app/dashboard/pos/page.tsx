'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem, MenuCategory, Table, ModifierGroup, Modifier } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Utensils, Search, Plus, Minus, Trash2, Users, Ticket, UserX, Move, SplitSquareHorizontal, Tag, Bell, Printer, CreditCard, Percent, Menu as MenuIcon, ChevronRight, ChevronDown, DollarSign, Banknote, Building2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentType = 'CASH' | 'CARD' | 'SPLIT_PAYMENT';

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  selectedModifiers?: {
    groupId: string;
    groupName: string;
    modifiers: { id: string; name: string; price: number }[];
  }[];
}

interface OrderData {
  id?: string;
  tableId?: string;
  table?: Table;
  status: string;
  notes: string;
  guestCount?: number;
  items: CartItem[];
}

export default function POSPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedItemModifiers, setSelectedItemModifiers] = useState<{
    menuItemId: string;
    selectedModifiers: {
      groupId: string;
      groupName: string;
      modifiers: { id: string; name: string; price: number }[];
    }[];
  } | null>(null);
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<MenuItem | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const [tablesRes, catsRes, itemsRes, modsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/categories`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items?available=true`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/modifier-groups`, { headers }),
        ]);
        if (tablesRes.ok) setTables(await tablesRes.json());
        if (catsRes.ok) setCategories(await catsRes.json());
        if (itemsRes.ok) setMenuItems(await itemsRes.json());
        if (modsRes.ok) setModifierGroups(await modsRes.json());
      } catch (e) {
        console.error('Failed to load POS data:', e);
      }
    }
    loadData();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function addToCart(item: MenuItem) {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setPendingCartItem(item);
      setSelectedItemModifiers({ menuItemId: item.id, selectedModifiers: [] });
      setModifierDialogOpen(true);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, selectedModifiers: [] }];
    });
  }

  function confirmModifiers() {
    if (!pendingCartItem) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === pendingCartItem.id);
      const cartItem: CartItem = { ...pendingCartItem, quantity: existing ? existing.quantity + 1 : 1, selectedModifiers: selectedItemModifiers?.selectedModifiers || [] };
      if (existing) return prev.map((i) => i.id === pendingCartItem.id ? cartItem : i);
      return [...prev, cartItem];
    });
    setModifierDialogOpen(false);
    setPendingCartItem(null);
    setSelectedItemModifiers(null);
  }

  function toggleModifier(_groupIndex: number, _modifierIndex: number, group: ModifierGroup, modifier: Modifier) {
    if (!selectedItemModifiers) return;
    const maxSelect = group.maxSelect || 1;
    const newSelected = [...(selectedItemModifiers.selectedModifiers || [])];
    let g = newSelected.find((m) => m.groupId === group.id);
    if (!g) { g = { groupId: group.id, groupName: group.name, modifiers: [] }; newSelected.push(g); }
    const modIdx = g.modifiers.findIndex((m) => m.id === modifier.id);
    if (modIdx >= 0) { g.modifiers.splice(modIdx, 1); }
    else { if (g.modifiers.length >= maxSelect && maxSelect > 0) return; g.modifiers.push({ id: modifier.id, name: modifier.name, price: modifier.price }); }
    setSelectedItemModifiers({ ...selectedItemModifiers, selectedModifiers: newSelected });
  }

  function removeFromCart(id: string) { setCart((prev) => prev.filter((i) => i.id !== id)); }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) => prev.map((i) => i.id === id ? (i.quantity + delta > 0 ? { ...i, quantity: i.quantity + delta } : i) : i).filter((i) => i.quantity > 0));
  }

  function clearCart() { setCart([]); setPaymentType(null); }

  function selectTable(tableId: string) {
    setSelectedTable(tableId);
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setCurrentOrder({ tableId: table.id, table, status: 'NEW', notes: '', guestCount: 1, items: [] });
    }
  }

  function openPaymentDialog() {
    if (!selectedTable) { toast({ title: 'Ошибка', description: 'Выберите стол', variant: 'destructive' }); return; }
    if (cart.length === 0) { toast({ title: 'Ошибка', description: 'Добавьте блюда', variant: 'destructive' }); return; }
    setPaymentType(null);
    setShowPaymentDialog(true);
  }

  async function processPayment() {
    if (!paymentType) return;
    setLoading(true);
    try {
      const splitCash = Math.round(total * 0.5);
      const splitCard = total - splitCash;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          tableId: selectedTable,
          notes: currentOrder?.notes || '',
          items: cart.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
            selectedModifiers: item.selectedModifiers || [],
          })),
          paymentType,
          cashAmount: paymentType === 'SPLIT_PAYMENT' ? splitCash : paymentType === 'CASH' ? total : 0,
          cardAmount: paymentType === 'SPLIT_PAYMENT' ? (total - splitCash) : paymentType === 'CARD' ? total : 0,
        }),
      });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Заказ оплачен' });
        clearCart();
        setSelectedTable('');
        setCurrentOrder(null);
        setShowPaymentDialog(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка оплаты');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const total = cart.reduce((sum, item) => {
    const modExtra = item.selectedModifiers?.reduce((s, g) => s + (g.modifiers || []).reduce((ss, m) => ss + m.price, 0), 0) || 0;
    return sum + (item.price + modExtra) * item.quantity;
  }, 0);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <MenuIcon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">POS Терминал</h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="text" placeholder="Поиск блюд..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10" />
          </div>
        </div>

        {selectedTable && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              <Ticket className="w-3 h-3 mr-1" />
              Стол {tables.find((t) => t.id === selectedTable)?.number}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setActionsMenuOpen(!actionsMenuOpen)}>
              Действия
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={cn(
            'w-64 border-r border-border bg-card flex flex-col transition-transform duration-300 absolute lg:relative z-20 h-full',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Столы
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => selectTable(table.id)}
                className={cn(
                  'w-full p-3 rounded-xl border-2 transition-all duration-200 text-left',
                  selectedTable === table.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
                  table.status === 'OCCUPIED' && 'border-orange-500 bg-orange-500/10',
                  table.status === 'RESERVED' && 'border-blue-500 bg-blue-500/10'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Стол {table.number}</span>
                  <Badge variant={table.status === 'FREE' ? 'secondary' : 'default'} className="text-xs">
                    {table.status === 'FREE' ? 'Свободен' : table.status === 'OCCUPIED' ? 'Занят' : 'Забронирован'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{table.capacity} мест</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <Button variant={!selectedCategory ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('')} className="flex-shrink-0">Все</Button>
              {categories.map((cat) => (
                <Button key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat.id)} className="flex-shrink-0">
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => addToCart(item)}
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Utensils className="w-12 h-12 text-muted-foreground" />
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Нет в наличии</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary">{item.price.toFixed(0)} ₽</span>
                      <Button size="sm" className="h-8 px-3 gradient-primary">
                        <Plus className="w-3 h-3 mr-1" />
                        Добавить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>

        <aside className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Текущий заказ
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Корзина пуста</p>
                <p className="text-sm mt-1">Добавьте товары из меню</p>
              </div>
            ) : (
              cart.map((item) => {
                const modExtra = item.selectedModifiers?.reduce((sum, g) =>
                  sum + (g.modifiers || []).reduce((s, m) => s + m.price, 0), 0
                ) || 0;
                const itemTotal = (item.price + modExtra) * item.quantity;
                return (
                <div key={item.id} className="p-3 bg-muted/50 rounded-xl border border-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.price.toFixed(0)} ₽ × {item.quantity}
                      </p>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedModifiers.map((g, gi) => (
                            <Badge key={gi} variant="outline" className="text-xs">
                              {g.modifiers.map(m => m.name).join(', ')}
                              {g.modifiers.reduce((s, m) => s + m.price, 0) > 0 &&
                                ` (+${g.modifiers.reduce((s, m) => s + m.price, 0)} ₽)`
                              }
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 p-0"><Minus className="w-3 h-3" /></Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 p-0"><Plus className="w-3 h-3" /></Button>
                    <span className="flex-1 text-right font-bold">{itemTotal.toFixed(0)} ₽</span>
                  </div>
                </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-border space-y-3 bg-muted/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Товаров</span>
                <span className="font-medium">{cart.reduce((sum, i) => sum + i.quantity, 0)} шт.</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Итого</span>
                <span className="font-bold text-2xl text-primary">{total.toFixed(0)} ₽</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" disabled={cart.length === 0}>
                <Percent className="w-4 h-4 mr-2" />
                Скидка
              </Button>
              <Button variant="outline" className="h-12" disabled={cart.length === 0}>
                <Printer className="w-4 h-4 mr-2" />
                Печать
              </Button>
            </div>

            <Button
              className="w-full h-14 text-lg font-semibold gradient-primary"
              onClick={openPaymentDialog}
              disabled={loading || !selectedTable || cart.length === 0}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {loading ? 'Обработка...' : 'Оплатить'}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Действия с заказом</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Users className="w-6 h-6" /><span>Гости</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><MessageSquare className="w-6 h-6" /><span>Комментарий</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Move className="w-6 h-6" /><span>Сменить стол</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><UserX className="w-6 h-6" /><span>Сменить официанта</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><SplitSquareHorizontal className="w-6 h-6" /><span>Разделить заказ</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Tag className="w-6 h-6" /><span>Тип заказа</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Bell className="w-6 h-6" /><span>Статус</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 text-destructive"><Trash2 className="w-6 h-6" /><span>Очистить</span></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modifierDialogOpen} onOpenChange={setModifierDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Модификаторы: {pendingCartItem?.name}</DialogTitle></DialogHeader>
          {selectedItemModifiers && pendingCartItem && (
            <div className="space-y-4 py-4">
              {pendingCartItem.modifierGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{group.name}</Label>
                    <span className="text-xs text-muted-foreground">
                      {group.maxSelect === 1 ? 'Один вариант' : `Макс. ${group.maxSelect}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.modifiers.map((mod) => {
                      const isSelected = selectedItemModifiers.selectedModifiers.find((m) => m.groupId === group.id)?.modifiers.find((m) => m.id === mod.id);
                      return (
                        <Button key={mod.id} variant={isSelected ? 'default' : 'outline'} size="sm" onClick={() => toggleModifier(0, 0, group, mod)} className="flex flex-col items-start">
                          <span>{mod.name}</span>
                          {mod.price !== 0 && <span className={`text-xs ${mod.price > 0 ? 'text-red-500' : 'text-green-500'}`}>{mod.price > 0 ? '+' : ''}{mod.price} ₽</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setModifierDialogOpen(false); setPendingCartItem(null); }} className="flex-1">Отмена</Button>
            <Button onClick={confirmModifiers} className="flex-1">Добавить в корзину</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Способ оплаты</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <Button variant={paymentType === 'CASH' ? 'default' : 'outline'} onClick={() => setPaymentType('CASH')} className="h-24 flex flex-col gap-2">
              <Banknote className="w-8 h-8" />
              <span>Наличные</span>
              <span className="text-xs font-normal text-muted-foreground">{total.toFixed(0)} ₽</span>
            </Button>
            <Button variant={paymentType === 'CARD' ? 'default' : 'outline'} onClick={() => setPaymentType('CARD')} className="h-24 flex flex-col gap-2">
              <Building2 className="w-8 h-8" />
              <span>Карта</span>
              <span className="text-xs font-normal text-muted-foreground">{total.toFixed(0)} ₽</span>
            </Button>
            <Button variant={paymentType === 'SPLIT_PAYMENT' ? 'default' : 'outline'} onClick={() => setPaymentType('SPLIT_PAYMENT')} className="h-24 flex flex-col gap-2">
              <DollarSign className="w-8 h-8" />
              <span>Раздельно</span>
              <span className="text-xs font-normal text-muted-foreground">{Math.round(total * 0.5).toFixed(0)} / {Math.round(total * 0.5).toFixed(0)}</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">Отмена</Button>
            <Button onClick={processPayment} disabled={!paymentType || loading} className="flex-1 gradient-primary">
              {loading ? 'Обработка...' : 'Подтвердить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
