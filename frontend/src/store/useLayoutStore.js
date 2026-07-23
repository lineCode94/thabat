import { create } from 'zustand';

import i18n, { applyLanguageAttributes, LANGUAGE_STORAGE_KEY } from '@/i18n';

const SIDEBAR_STORAGE_KEY = 'thabat-sidebar-collapsed';

function readBoolean(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

function readLanguage() {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
}

if (typeof window !== 'undefined') {
  applyLanguageAttributes(readLanguage());
}

export const useLayoutStore = create((set, get) => ({
  isSidebarCollapsed: readBoolean(SIDEBAR_STORAGE_KEY, false),
  isMobileSidebarOpen: false,
  language: readLanguage(),

  toggleSidebar: () => {
    const next = !get().isSidebarCollapsed;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    set({ isSidebarCollapsed: next });
  },

  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  setLanguage: (language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyLanguageAttributes(language);
    i18n.changeLanguage(language);
    set({ language });
  },
}));
