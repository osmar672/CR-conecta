import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cr-conecta:preferencias-visual';

// Pasos de tamaño de letra. El diseño usa píxeles fijos, por eso la escala se
// aplica con `zoom` sobre el body en vez de cambiar el `font-size` raíz.
export const TEXT_SCALES = [1, 1.15, 1.3];

const DEFAULT_PREFERENCES = {
  theme: 'light',
  textScale: TEXT_SCALES[0],
  colorMode: 'default'
};

function prefersDarkScheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readPreferences() {
  let stored;
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    stored = null;
  }

  const storedTheme = stored?.theme === 'dark' || stored?.theme === 'light' ? stored.theme : null;
  const storedScale = TEXT_SCALES.includes(stored?.textScale) ? stored.textScale : null;

  return {
    theme: storedTheme || (prefersDarkScheme() ? 'dark' : 'light'),
    textScale: storedScale ?? DEFAULT_PREFERENCES.textScale,
    colorMode: stored?.colorMode === 'colorblind' ? 'colorblind' : 'default'
  };
}

export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.colorMode = preferences.colorMode;
    document.body.style.zoom = preferences.textScale === 1 ? '' : String(preferences.textScale);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Navegación privada: la preferencia queda solo durante esta sesión.
    }
  }, [preferences]);

  const toggleTheme = useCallback(() => {
    setPreferences(current => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const cycleTextScale = useCallback(() => {
    setPreferences(current => {
      const nextIndex = (TEXT_SCALES.indexOf(current.textScale) + 1) % TEXT_SCALES.length;
      return { ...current, textScale: TEXT_SCALES[nextIndex] };
    });
  }, []);

  const toggleColorMode = useCallback(() => {
    setPreferences(current => ({
      ...current,
      colorMode: current.colorMode === 'colorblind' ? 'default' : 'colorblind'
    }));
  }, []);

  return {
    ...preferences,
    isDark: preferences.theme === 'dark',
    isColorblind: preferences.colorMode === 'colorblind',
    isLargestText: preferences.textScale === TEXT_SCALES[TEXT_SCALES.length - 1],
    toggleTheme,
    cycleTextScale,
    toggleColorMode
  };
}
