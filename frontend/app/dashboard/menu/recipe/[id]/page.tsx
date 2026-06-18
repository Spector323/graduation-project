'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Ingredient, RecipeItem, MenuItem } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const menuItemId = params.id as string;

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [recipeCost, setRecipeCost] = useState<{ items: any[]; totalCost: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items/${menuItemId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const itemData = await res.json();
        setMenuItem(itemData);

        const [ingData, recipeData, costData] = await Promise.all([
          api.getIngredients(),
          api.getRecipe(menuItemId),
          api.getRecipeCost(menuItemId),
        ]);
        setIngredients(ingData);
        setRecipe(recipeData);
        setRecipeCost(costData);
      } catch (error) {
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [menuItemId]);

  const addIngredientToRecipe = () => {
    if (ingredients.length === 0) {
      toast.error('Сначала добавьте ингредиенты на склад');
      return;
    }
    setRecipe([...recipe, { id: 'temp', menuItemId, ingredientId: '', quantity: 0, ingredient: undefined }]);
  };

  const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const newRecipe = [...recipe];
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === value);
      newRecipe[index] = { ...newRecipe[index], ingredientId: value, ingredient: ing };
    } else {
      newRecipe[index] = { ...newRecipe[index], [field]: value };
    }
    setRecipe(newRecipe);
  };

  const removeRecipeItem = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    const hasEmpty = recipe.some(r => !r.ingredientId || r.quantity <= 0);
    if (hasEmpty) {
      toast.error('Заполните все поля: выберите ингредиент и укажите количество');
      return;
    }
    try {
      const items = recipe.map(r => ({ ingredientId: r.ingredientId, quantity: r.quantity }));
      await api.updateRecipe(menuItemId, items);
      toast.success('Техкарта сохранена');
      router.push('/dashboard/menu');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  if (loading) return <div className="p-6">Загрузка...</div>;
  if (!menuItem) return <div className="p-6">Блюдо не найдено</div>;

  const foodCostPercent = recipeCost && recipeCost.totalCost > 0
    ? ((recipeCost.totalCost / menuItem.price) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/menu')}><ArrowLeft className="w-4 h-4 mr-2" /> Назад</Button>
        <div>
          <h1 className="text-3xl font-bold">📋 Техкарта: {menuItem.name}</h1>
          <p className="text-muted-foreground">Настройте состав блюда для автоматического списания ингредиентов</p>
        </div>
        <Button onClick={saveRecipe} className="ml-auto"><Save className="w-4 h-4 mr-2" /> Сохранить</Button>
      </div>

      {/* Фудкост */}
      {recipeCost && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Цена продажи</div>
              <div className="text-2xl font-bold">{menuItem.price.toFixed(0)} ₽</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Себестоимость</div>
              <div className="text-2xl font-bold text-red-600">{recipeCost.totalCost.toFixed(2)} ₽</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Фудкост</div>
              <div className={`text-2xl font-bold ${parseFloat(foodCostPercent) > 40 ? 'text-red-600' : 'text-green-600'}`}>{foodCostPercent}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Состав блюда</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ингредиент</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Ед. изм.</TableHead>
                <TableHead>Цена за ед.</TableHead>
                <TableHead>Стоимость</TableHead>
                <TableHead>Остаток на складе</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={item.ingredientId}
                      onValueChange={(val) => updateRecipeItem(index, 'ingredientId', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите ингредиент" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateRecipeItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-24"
                      disabled={!item.ingredientId}
                    />
                  </TableCell>
                  <TableCell>{item.ingredient?.unit || '—'}</TableCell>
                  <TableCell>{item.ingredient ? item.ingredient.costPerUnit.toFixed(2) + ' ₽' : '—'}</TableCell>
                  <TableCell className="font-medium">
                    {item.ingredient && item.quantity > 0
                      ? (item.quantity * item.ingredient.costPerUnit).toFixed(2) + ' ₽'
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {item.ingredient ? (
                      <span className={item.ingredient.stock <= item.ingredient.minStock ? 'text-red-500 font-bold' : ''}>
                        {item.ingredient.stock.toFixed(2)}
                      </span>
                    ) : '—'}
                    {item.ingredient && item.quantity > 0 && item.ingredient.stock < item.quantity && (
                      <Badge variant="destructive" className="ml-2 text-xs">Мало!</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => removeRecipeItem(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button onClick={addIngredientToRecipe} variant="outline" className="mt-4 w-full">
            <Plus className="w-4 h-4 mr-2" /> Добавить ингредиент
          </Button>
          {recipe.length === 0 && (
            <p className="text-center text-muted-foreground py-8">У ингредиентов нет состава. Добавьте ингредиенты, чтобы настроить техкарту.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
