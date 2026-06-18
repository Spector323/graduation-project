'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Table } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/lib/socket-context';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Move, TableIcon, Maximize, Minimize, RotateCw, Lock, Unlock,
  Users, Plus, LayoutGrid, GripHorizontal, Save,
} from 'lucide-react';

interface TablePosition {
  id: string;
  x: number;
  y: number;
}

export default function FloorPlanPage() {
  const { socket } = useSocket();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data: Table[] = await res.json();
        setTables(data);

        const stored = localStorage.getItem(`floor-positions`);
        const savedPositions: Record<string, { x: number; y: number }> = stored ? JSON.parse(stored) : {};
        const newPositions: Record<string, { x: number; y: number }> = {};

        data.forEach((table, index) => {
          if (savedPositions[table.id]) {
            newPositions[table.id] = savedPositions[table.id];
          } else {
            const cols = 6;
            const row = Math.floor(index / cols);
            const col = index % cols;
            newPositions[table.id] = {
              x: 40 + col * 160,
              y: 40 + row * 160,
            };
          }
        });
        setPositions(newPositions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  useEffect(() => {
    if (!socket) return;
    socket.on('table:updated', () => fetchTables());
    socket.on('table:created', () => fetchTables());
    socket.on('table:deleted', () => fetchTables());
    return () => { socket.off('table:updated'); socket.off('table:created'); socket.off('table:deleted'); };
  }, [socket, fetchTables]);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!editMode) return;
    e.preventDefault();
    setDragging(tableId);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left - (positions[tableId]?.x || 0),
        y: e.clientY - rect.top - (positions[tableId]?.y || 0),
      };
    }
  };

  const handleTouchStart = (e: React.TouchEvent, tableId: string) => {
    if (!editMode) return;
    setDragging(tableId);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      dragOffset.current = {
        x: touch.clientX - rect.left - (positions[tableId]?.x || 0),
        y: touch.clientY - rect.top - (positions[tableId]?.y || 0),
      };
    }
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.current.x, rect.width - 80));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.current.y, rect.height - 80));
      setPositions(prev => ({ ...prev, [dragging]: { x, y } }));
    };

    const handleMouseUp = () => setDragging(null);
    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(touch.clientX - rect.left - dragOffset.current.x, rect.width - 80));
      const y = Math.max(0, Math.min(touch.clientY - rect.top - dragOffset.current.y, rect.height - 80));
      setPositions(prev => ({ ...prev, [dragging]: { x, y } }));
    };
    const handleTouchEnd = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging]);

  const savePositions = () => {
    setSaving(true);
    localStorage.setItem(`floor-positions`, JSON.stringify(positions));
    setTimeout(() => setSaving(false), 500);
  };

  const statusColors: Record<string, string> = {
    FREE: 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    RESERVED: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
    OCCUPIED: 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  };

  const statusLabels: Record<string, string> = {
    FREE: 'Свободен',
    RESERVED: 'Забронирован',
    OCCUPIED: 'Занят',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-[600px] bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  const minX = Math.min(...Object.values(positions).map(p => p.x), 0);
  const minY = Math.min(...Object.values(positions).map(p => p.y), 0);
  const maxX = Math.max(...Object.values(positions).map(p => p.x + 80), 800);
  const maxY = Math.max(...Object.values(positions).map(p => p.y + 100), 600);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            Схема зала
          </h1>
          <p className="text-sm text-muted-foreground">
            {tables.length} {tables.length === 1 ? 'стол' : tables.length < 5 ? 'стола' : 'столов'} — нажмите на стол для просмотра заказов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 mr-4">
            {(['FREE', 'RESERVED', 'OCCUPIED'] as const).map(status => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  status === 'FREE' && 'bg-green-500',
                  status === 'RESERVED' && 'bg-yellow-500',
                  status === 'OCCUPIED' && 'bg-red-500',
                )} />
                <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
              </div>
            ))}
          </div>
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
            {editMode ? 'Блокировать' : 'Редактировать'}
          </Button>
          {editMode && (
            <Button size="sm" onClick={savePositions} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div
          ref={containerRef}
          className={cn(
            'xl:col-span-3 relative bg-card border border-border rounded-xl overflow-hidden',
            'min-h-[500px]',
            editMode && 'cursor-grab',
            dragging && 'cursor-grabbing',
          )}
          style={{ height: Math.max(500, maxY + 80) }}
        >
          {tables.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <TableIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Нет столов</p>
              <p className="text-sm">Добавьте столы в настройках</p>
            </div>
          ) : (
            tables.map(table => {
              const pos = positions[table.id] || { x: 0, y: 0 };
              return (
                <button
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  onTouchStart={(e) => handleTouchStart(e, table.id)}
                  onClick={() => {
                    if (!editMode) router.push(`/dashboard/orders?table=${table.id}`);
                  }}
                  className={cn(
                    'absolute flex flex-col items-center justify-center rounded-xl border-2 transition-all',
                    'hover:shadow-lg',
                    statusColors[table.status] || 'border-gray-300',
                    editMode && 'hover:ring-2 hover:ring-primary cursor-grab',
                    dragging === table.id && 'shadow-2xl scale-105 z-10 cursor-grabbing',
                    !editMode && 'cursor-pointer',
                  )}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: 80,
                    height: 100,
                  }}
                >
                  {editMode && (
                    <GripHorizontal className="w-4 h-4 mb-1 opacity-50" />
                  )}
                  <TableIcon className="w-5 h-5 mb-1" />
                  <span className="text-sm font-bold">Стол {table.number}</span>
                  <span className="text-[10px] opacity-75">{table.capacity} чел.</span>
                </button>
              );
            })
          )}
        </div>

        <Card className="xl:col-span-1 border-border shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-primary" />
              Список столов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tables
              .sort((a, b) => a.number - b.number)
              .map(table => (
                <div
                  key={table.id}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer transition-colors',
                    'hover:bg-accent',
                  )}
                  onClick={() => router.push(`/dashboard/orders?table=${table.id}`)}
                >
                  <div className={cn(
                    'w-2.5 h-2.5 rounded-full flex-shrink-0',
                    table.status === 'FREE' && 'bg-green-500',
                    table.status === 'RESERVED' && 'bg-yellow-500',
                    table.status === 'OCCUPIED' && 'bg-red-500',
                  )} />
                  <span className="font-medium flex-1">Стол {table.number}</span>
                  <span className="text-xs text-muted-foreground">{table.capacity} чел.</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {table.location || '—'}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
