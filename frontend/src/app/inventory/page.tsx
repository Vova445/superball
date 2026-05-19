'use client';

import { PageShell } from '@/components/layout/PageShell';
import { InventoryScreen } from '@/components/inventory/InventoryScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function InventoryPage() {
  const { ready } = useRequireAuth();
  if (!ready) return null;

  return (
    <PageShell title="Inventory" maxWidth="6xl">
      <p className="mb-4 text-sm text-white/50">Drag items onto loadout slots to equip.</p>
      <InventoryScreen />
    </PageShell>
  );
}
