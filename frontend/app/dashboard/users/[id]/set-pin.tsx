'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KeyRound } from 'lucide-react';

interface SetPinDialogProps {
  userName: string;
  onSuccess?: () => void;
}

export default function SetPinDialog({ userName, onSuccess }: SetPinDialogProps) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pinCode.length < 4) {
      toast({
        title: 'Ошибка',
        description: 'PIN-код должен содержать минимум 4 цифры',
        variant: 'destructive',
      });
      return;
    }

    if (pinCode !== confirmPin) {
      toast({
        title: 'Ошибка',
        description: 'PIN-коды не совпадают',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d+$/.test(pinCode)) {
      toast({
        title: 'Ошибка',
        description: 'PIN-код должен содержать только цифры',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userId = params.id as string;
      console.log('Setting PIN for user:', userId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pin/${userId}/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pinCode }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Не удалось установить PIN-код');
      }

      toast({
        title: 'Успешно',
        description: `PIN-код установлен для ${userName}`,
      });
      
      setPinCode('');
      setConfirmPin('');
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Set PIN error:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="w-4 h-4" />
          Установить PIN
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Установка PIN-кода</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSetPin} className="space-y-4">
          <div className="space-y-2">
            <Label>Сотрудник</Label>
            <p className="text-sm font-medium">{userName}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pinCode">PIN-код</Label>
            <Input
              id="pinCode"
              type="password"
              placeholder="4-6 цифр"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Подтвердите PIN-код</Label>
            <Input
              id="confirmPin"
              type="password"
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
              {loading ? 'Сохранение...' : 'Установить PIN'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
