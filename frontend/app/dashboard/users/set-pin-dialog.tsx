'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { KeyRound, Trash2, Eye, EyeOff, Copy } from 'lucide-react';

interface SetPinDialogProps {
  userId: string;
  userName: string;
  hasPin?: boolean;
  onSuccess?: () => void;
}

export default function SetPinDialog({ userId, userName, hasPin = false, onSuccess }: SetPinDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [displayedPin, setDisplayedPin] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pinCode.length < 4) {
      toast({ title: 'Ошибка', description: 'PIN-код должен содержать минимум 4 цифры', variant: 'destructive' });
      return;
    }

    if (pinCode !== confirmPin) {
      toast({ title: 'Ошибка', description: 'PIN-коды не совпадают', variant: 'destructive' });
      return;
    }

    if (!/^\d+$/.test(pinCode)) {
      toast({ title: 'Ошибка', description: 'PIN-код должен содержать только цифры', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pin/${userId}/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pinCode }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Не удалось установить PIN-код');
      }

      setDisplayedPin(pinCode);
      setShowPinDialog(true);
      
      setPinCode('');
      setConfirmPin('');
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePin = async () => {
    if (!confirm('Вы уверены, что хотите удалить PIN-код?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pin/${userId}/delete-pin`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось удалить PIN-код');
      }

      toast({ title: 'Успешно', description: `PIN-код удалён для ${userName}` });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Скопировано', description: 'PIN-код скопирован в буфер обмена' });
  };

  return (
    <>
      <div className="flex gap-1">
        <Button variant={hasPin ? "default" : "outline"} size="sm" className="gap-1 h-8 text-xs" onClick={() => setOpen(true)}>
          <KeyRound className="w-3 h-3" />
          {hasPin ? 'Изменить PIN' : 'Установить PIN'}
        </Button>
        {hasPin && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => {
            e.stopPropagation();
            handleDeletePin();
          }} disabled={loading}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasPin ? 'Изменение PIN-кода' : 'Установка PIN-кода'}
            </DialogTitle>
            <DialogDescription>
              Сотрудник: {userName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pinCode">PIN-код</Label>
              <div className="relative">
                <Input
                  id="pinCode"
                  type={showPin ? 'text' : 'password'}
                  placeholder="4-6 цифр"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Подтвердите PIN-код</Label>
              <Input
                id="confirmPin"
                type={showPin ? 'text' : 'password'}
                placeholder="Повторите PIN-код"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="gradient-primary" disabled={loading}>
                {loading ? 'Сохранение...' : (hasPin ? 'Изменить PIN' : 'Установить PIN')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPinDialog(false);
          setOpen(false);
          onSuccess?.();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIN-код установлен!</DialogTitle>
            <DialogDescription>
              Запишите PIN-код сотрудника
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{userName}</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-[0.5em] text-primary">
                  {displayedPin.split('').map((c, i) => (
                    <span key={i}>{c}</span>
                  ))}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(displayedPin)}
                  className="h-10 w-10 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Этот PIN-код работает только в вашем заведении
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

