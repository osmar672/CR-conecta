import { Moon, Palette, Sun, Type } from 'lucide-react';
import { useDisplayPreferences } from '../lib/useDisplayPreferences';

export function DisplayPreferencesControls() {
  const {
    textScale,
    isDark,
    isColorblind,
    toggleTheme,
    cycleTextScale,
    toggleColorMode
  } = useDisplayPreferences();

  const scalePercent = Math.round(textScale * 100);

  return (
    <div className="display-controls" role="group" aria-label="Preferencias de visualización">
      <button
        type="button"
        className="display-control"
        onClick={toggleTheme}
        aria-pressed={isDark}
        title={isDark ? 'Cambiar a modo claro' : 'Activar modo oscuro'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        <span>Oscuro</span>
      </button>

      <button
        type="button"
        className="display-control"
        onClick={cycleTextScale}
        title={`Aumentar tamaño de las letras. Tamaño actual: ${scalePercent}%`}
      >
        <Type size={16} />
        <span className="display-control-value">{scalePercent}%</span>
      </button>

      <button
        type="button"
        className="display-control"
        onClick={toggleColorMode}
        aria-pressed={isColorblind}
        title={isColorblind
          ? 'Desactivar modo daltónico'
          : 'Activar modo daltónico (colores distinguibles para daltonismo)'}
      >
        <Palette size={16} />
        <span>Daltónico</span>
      </button>
    </div>
  );
}
