import { Moon, Palette, Sun, Type } from 'lucide-react';
import { TEXT_SCALES, useDisplayPreferences } from '../lib/useDisplayPreferences';

function PreferenceRow({ icon, label, description, state, active, onClick, title }) {
  return (
    <button
      type="button"
      className="display-preference-row"
      onClick={onClick}
      aria-pressed={active}
      title={title}
    >
      <span className="display-preference-icon">{icon}</span>
      <span className="display-preference-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      {state && <span className="display-preference-state">{state}</span>}
      <span className={`display-switch${active ? ' on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

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
  const isLargestScale = textScale === TEXT_SCALES[TEXT_SCALES.length - 1];

  return (
    <div className="display-preferences">
      <PreferenceRow
        icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
        label="Modo oscuro"
        description="Reduce el brillo de la pantalla con un fondo oscuro."
        state={isDark ? 'Activado' : 'Desactivado'}
        active={isDark}
        onClick={toggleTheme}
        title={isDark ? 'Cambiar a modo claro' : 'Activar modo oscuro'}
      />

      <PreferenceRow
        icon={<Type size={18} />}
        label="Tamaño de las letras"
        description="Aumenta el tamaño del texto para leer con mayor comodidad."
        state={`${scalePercent}%`}
        active={textScale > 1}
        onClick={cycleTextScale}
        title={isLargestScale
          ? 'Volver al tamaño normal del texto'
          : `Aumentar el tamaño de las letras. Tamaño actual: ${scalePercent}%`}
      />

      <PreferenceRow
        icon={<Palette size={18} />}
        label="Modo daltónico"
        description="Paleta con colores distinguibles en casos de daltonismo."
        state={isColorblind ? 'Activado' : 'Desactivado'}
        active={isColorblind}
        onClick={toggleColorMode}
        title={isColorblind
          ? 'Desactivar modo daltónico'
          : 'Activar modo daltónico (colores distinguibles para daltonismo)'}
      />
    </div>
  );
}
