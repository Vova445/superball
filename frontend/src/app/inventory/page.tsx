'use client';

import { PageShell } from '@/components/layout/PageShell';
import { InventoryScreen } from '@/components/inventory/InventoryScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function InventoryPage() {
  const { ready } = useRequireAuth();
  if (!ready) return null;

  return (
    <PageShell maxWidth="full">
      <InventoryScreen />
    </PageShell>
  );
}
