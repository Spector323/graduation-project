'use client';

import { useEffect, useState } from 'react';
import { api, Ingredient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, Package, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editStock, setEditStock] = useState('');
  const [formData, setFormData] = useState({ name: '', unit: 'g', costPerUnit: 0, minStock: 0, stock: 0 });

  const fetchIngredients = async () => {
    try {
      const data = await api.getIngredients();
      setIngredients(data);
    } catch (error) {
      toast.error('Не удалось загрузить ингредиенты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIngredients(); }, []);

  const handleAdd = async () => {
    if (!formData.name || !formData.unit) { toast.error('Заполните название и единицу измерения'); return; }
    try {
      await api.createIngredient(formData);
      toast.success('Ингредиент добавлен');
      setIsAddDialogOpen(false);
      setFormData({ name: '', unit: 'g', costPerUnit: 0, minStock: 0, stock: 0 });
      fetchIngredients();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка добавления');
    }
  };

  const handleUpdateStock = async (id: string, operation: 'add' | 'subtract') => {
    const amount = prompt(`Введите количество для ${operation === 'add' ? 'прихода' : 'списания'}:`);
    if (!amount || isNaN(parseFloat(amount))) return;
    try {
      await api.updateIngredientStock(id, { stock: parseFloat(amount), operation });
      toast.success('Остаток обновлён');
      fetchIngredients();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления');
    }
  };

  const handleEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setFormData({ name: ing.name, unit: ing.unit, costPerUnit: ing.costPerUnit, minStock: ing.minStock, stock: ing.stock });
  };

  const handleSaveEdit = async () => {
    if (!editingIngredient) return;
    try {
      await api.updateIngredient(editingIngredient.id, formData);
      toast.success('Ингредиент обновлён');
      setEditingIngredient(null);
      fetchIngredients();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить ингредиент?')) return;
    try {
      await api.deleteIngredient(id);
      toast.success('Ингредиент удалён');
      fetchIngredients();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📦 Склад и Ингредиенты</h1>
          <p className="text-muted-foreground">Управление остатками и техкартами блюд</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/menu')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Меню
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Добавить ингредиент</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Новый ингредиент</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Название</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Томат, Сыр моцарелла..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ед. измерения</Label>
                    <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="г, кг, л, мл, шт" />
                  </div>
                  <div>
                    <Label>Себестоимость за ед. (₽)</Label>
                    <Input type="number" step="0.01" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Начальный остаток</Label>
                    <Input type="number" step="0.01" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Мин. остаток</Label>
                    <Input type="number" step="0.01" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full">Сохранить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Список ингредиентов ({ingredients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Загрузка...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Остаток</TableHead>
                  <TableHead>Ед.</TableHead>
                  <TableHead>Себестоимость</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">{ing.name}</TableCell>
                    <TableCell className={ing.stock <= ing.minStock ? 'text-red-500 font-bold' : ''}>
                      {ing.stock.toFixed(2)}
                    </TableCell>
                    <TableCell>{ing.unit}</TableCell>
                    <TableCell>{ing.costPerUnit.toFixed(2)} ₽</TableCell>
                    <TableCell>
                      {ing.stock <= ing.minStock ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Мало
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">В норме</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(ing)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStock(ing.id, 'add')} className="text-green-600">+ Приход</Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStock(ing.id, 'subtract')} className="text-orange-600">− Списание</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(ing.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingIngredient} onOpenChange={(open) => !open && setEditingIngredient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать: {editingIngredient?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ед. измерения</Label>
                <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
              </div>
              <div>
                <Label>Себестоимость за ед. (₽)</Label>
                <Input type="number" step="0.01" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Текущий остаток</Label>
                <Input type="number" step="0.01" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Мин. остаток</Label>
                <Input type="number" step="0.01" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) })} />
              </div>
            </div>
            <Button onClick={handleSaveEdit} className="w-full">Сохранить изменения</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
