'use client';

import { SessionProvider } from 'next-auth/react';
import PrintReceipt from '@/components/PrintReceipt';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PrintReceipt />
    </SessionProvider>
  );
}
