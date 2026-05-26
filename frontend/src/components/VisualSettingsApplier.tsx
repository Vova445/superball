'use client';

import { useEffect } from 'react';
import { useSettingsStore, visualFilterToCss } from '@/store/useSettingsStore';

export function VisualSettingsApplier() {
  const brightness = useSettingsStore((state) => state.brightness);
  const contrast = useSettingsStore((state) => state.contrast);

  useEffect(() => {
    document.body.style.filter = visualFilterToCss(brightness, contrast);
    document.body.style.transformOrigin = 'center center';

    return () => {
      document.body.style.filter = '';
      document.body.style.transformOrigin = '';
    };
  }, [brightness, contrast]);

  return null;
}
