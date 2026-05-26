import { create } from 'zustand';
import { getClientLocale, type Locale } from '@/lib/i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: typeof window !== 'undefined' ? getClientLocale() : 'uk',
  setLocale: (locale) => set({ locale }),
}));
