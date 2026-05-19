'use client';

import { PageShell } from '@/components/layout/PageShell';
import { ShopScreen } from '@/components/shop/ShopScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ShopPage() {
  const { ready } = useRequireAuth();
  if (!ready) return null;

  return (
    <PageShell title="Shop" maxWidth="6xl">
      <ShopScreen />
    </PageShell>
  );
}
