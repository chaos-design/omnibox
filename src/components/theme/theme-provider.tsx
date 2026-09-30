'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

import {
  defaultTheme,
  resolveTheme,
  type Theme,
  themeColors,
  themeStorageKey,
} from '../../utils/theme';

interface ThemeContextValue {
  setTheme: (theme: Theme) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  return resolveTheme(document.documentElement.dataset.theme);
}

function getServerThemeSnapshot(): Theme {
  return defaultTheme;
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themeColors[theme]);

  if (persist) {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {}
  }

  themeListeners.forEach((listener) => listener());
}

function subscribeToTheme(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey) {
      applyTheme(resolveTheme(event.newValue), false);
    }
  };

  themeListeners.add(listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme, true);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);
  const value = useMemo(
    () => ({ setTheme, theme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 中使用。');
  }

  return context;
}
