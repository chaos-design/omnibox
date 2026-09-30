export type Theme = 'dark' | 'light';

export const defaultTheme: Theme = 'dark';
export const themeStorageKey = 'OMNIBOX_THEME';
export const themeColors: Record<Theme, string> = {
  dark: '#101218',
  light: '#f5f7fa',
};

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function resolveTheme(value: unknown): Theme {
  return isTheme(value) ? value : defaultTheme;
}

export const themeInitScript = `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem('${themeStorageKey}');
      const theme = storedTheme === 'light' ? 'light' : 'dark';
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '${themeColors.dark}' : '${themeColors.light}');
    } catch {}
  })();
`;
