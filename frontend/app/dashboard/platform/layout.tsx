'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'PLATFORM_OWNER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'PLATFORM_OWNER') {
    return null;
  }

  return <>{children}</>;
}
