import * as React from 'react';

export enum Theme {
  light = 'light',
  dark = 'dark',
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && Object.values(Theme).includes(value as Theme);
}

type ThemeContextType = [Theme | null, (theme: Theme) => void];

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);
ThemeContext.displayName = 'ThemeContext';

const prefersLightMQ = '(prefers-color-scheme: light)';

export function ThemeProvider({
  children,
  theme: startingTheme,
}: {
  children: React.ReactNode;
  theme: Theme | null;
}) {
  const [theme, setTheme] = React.useState<Theme | null>(() => {
    if (startingTheme) {
      if (isTheme(startingTheme)) return startingTheme;
      else return null;
    }
    if (typeof document === 'undefined') return null;
    return window.matchMedia(prefersLightMQ).matches ? Theme.light : Theme.dark;
  });

  const nextTheme = React.useCallback(
    (next: Theme) => {
      if (!next || next === theme || !isTheme(next)) return;
      if (typeof document !== 'undefined') {
        document.getElementsByTagName('html')[0].className = next;
      }
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.open('POST', '/action/set-theme');
      xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xmlhttp.send(JSON.stringify({ theme: next }));
      setTheme(next);
    },
    [theme],
  );

  return <ThemeContext.Provider value={[theme, nextTheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  const [theme, setTheme] = context;
  const isDark = theme === Theme.dark;
  const isLight = theme === Theme.light;
  const nextTheme = React.useCallback(() => {
    const next = theme === Theme.light ? Theme.dark : Theme.light;
    setTheme(next);
  }, [theme]);
  return { theme, isLight, isDark, setTheme, nextTheme };
}
