'use client';

import { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Plus, Edit2, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/categories`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (itemsRes.ok) setMenuItems(await itemsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/menu/items/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/menu/items`;
      const method = editingItem ? 'PUT' : 'POST';

      const body: any = {
        ...formData,
        price: parseFloat(formData.price),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: `Блюдо ${editingItem ? 'обновлено' : 'добавлено'}` });
        setItemDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить блюдо', variant: 'destructive' });
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Удалить это блюдо?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Блюдо удалено' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить блюдо', variant: 'destructive' });
    }
  }

  function resetForm() {
    setFormData({ name: '', description: '', price: '', categoryId: '', available: true });
    setEditingItem(null);
  }

  function handleEditItem(item: MenuItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId || '',
      available: item.available,
    });
    setItemDialogOpen(true);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Меню</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление меню ресторана
        </p>
      </div>
        <Button onClick={() => { resetForm(); setItemDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить блюдо
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="available">Доступны</TabsTrigger>
          <TabsTrigger value="unavailable">Недоступны</TabsTrigger>
        </TabsList>

        {['all', 'available', 'unavailable'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {menuItems
                      .filter((item) => {
                        if (tab === 'available') return item.available;
                        if (tab === 'unavailable') return !item.available;
                        return true;
                      })
                      .map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Utensils className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{item.price.toFixed(0)} ₽</Badge>
                                <Badge variant={item.available ? 'default' : 'secondary'}>
                                  {item.available ? 'Доступно' : 'Недоступно'}
                                </Badge>
                                {item.category && (
                                  <span className="text-xs text-muted-foreground">{item.category.name}</span>
                                )}
                                {item.recipe && item.recipe.length > 0 && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    📋 {item.recipe.length} ингредиентов
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="Техкарта" onClick={() => router.push(`/dashboard/menu/recipe/${item.id}`)}>
                              <BookOpen className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Редактировать блюдо' : 'Добавить блюдо'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="available">Доступно для заказа</Label>
            </div>

            <Button type="submit" className="w-full">
              {editingItem ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
