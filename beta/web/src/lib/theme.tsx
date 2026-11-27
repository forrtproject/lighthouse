import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readColors, type Colors } from './echarts';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; colors: Colors }

const Ctx = createContext<ThemeCtx | null>(null);

// Same storage key as the current Lighthouse site, so the choice carries over.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-theme') as Theme) || 'light',
  );
  const [colors, setColors] = useState<Colors>(() => readColors());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* private mode */ }
    setColors(readColors());   // charts read resolved token values
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ theme, toggle, colors }), [theme, toggle, colors]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
