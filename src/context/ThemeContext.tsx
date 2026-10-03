import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'clinical_light';
export type ThemePreference = 'auto_schedule' | 'dark' | 'clinical_light';
export type FontSizeScale = 'normal' | 'large';

export interface UserSettings {
  preference: ThemePreference; // 'auto_schedule' (Opción 1) | 'dark' | 'clinical_light'
  theme: ThemeMode; // Tema visual actualmente renderizado
  highContrast: boolean;
  fontSize: FontSizeScale;
  reducedMotion: boolean;
}

/**
 * Calcula si corresponde el modo 'Clinical Light' o 'Modo Oscuro'
 * según la Opción 1 (Horario Clínico Predefinido):
 * - 07:00 AM a 06:30 PM (18:30) => 'clinical_light'
 * - 06:30 PM a 06:59 AM => 'dark'
 */
export const getClinicalScheduledTheme = (date = new Date()): ThemeMode => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  // 07:00 AM = 7 * 60 = 420 minutos
  // 06:30 PM (18:30) = 18 * 60 + 30 = 1110 minutos
  if (totalMinutes >= 420 && totalMinutes < 1110) {
    return 'clinical_light';
  }
  return 'dark';
};

const STORAGE_KEY = 'ccmi_user_settings_v2';
const LEGACY_STORAGE_KEY = 'ccmi_user_settings_v1';

const DEFAULT_SETTINGS: UserSettings = {
  preference: 'auto_schedule',
  theme: getClinicalScheduledTheme(),
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
};

/**
 * Guarda inmediatamente de manera síncrona en localStorage para garantizar
 * que la preferencia manual persista incluso ante cierres o refrescos inmediatos.
 */
const saveSettingsToStorage = (settingsToSave: UserSettings) => {
  try {
    const payload = JSON.stringify(settingsToSave);
    localStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(LEGACY_STORAGE_KEY, payload);
    localStorage.setItem('ccmi_theme_mode', settingsToSave.theme);
    localStorage.setItem('ccmi_theme_preference', settingsToSave.preference);
  } catch (e) {
    console.warn('[ThemeContext] Error guardando configuración en localStorage:', e);
  }
};

/**
 * Lee de localStorage priorizando estrictamente la selección manual del usuario.
 */
const loadSettingsFromStorage = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // PRIORIDAD A LA SELECCIÓN MANUAL:
      // Si el usuario seleccionó 'clinical_light' o 'dark', esa selección manual manda
      // y se mantiene fija sin importar la hora del día.
      let preference: ThemePreference = 'auto_schedule';
      if (parsed.preference === 'clinical_light' || parsed.preference === 'dark') {
        preference = parsed.preference;
      } else if (parsed.preference === 'auto_schedule') {
        preference = 'auto_schedule';
      } else if (parsed.theme === 'clinical_light' || parsed.theme === 'dark') {
        // Compatibilidad con registros manuales previos
        preference = parsed.theme;
      }

      const activeTheme: ThemeMode = 
        preference === 'auto_schedule'
          ? getClinicalScheduledTheme()
          : preference; // Si es manual, se usa exactamente el tema manual seleccionado

      return {
        preference,
        theme: activeTheme,
        highContrast: Boolean(parsed.highContrast),
        fontSize: parsed.fontSize === 'large' ? 'large' : 'normal',
        reducedMotion: Boolean(parsed.reducedMotion),
      };
    }
  } catch (e) {
    console.warn('[ThemeContext] Error leyendo configuración previa:', e);
  }
  return DEFAULT_SETTINGS;
};

interface ThemeContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  setPreference: (pref: ThemePreference) => void;
  isClinicalLight: boolean;
  isAutoSchedule: boolean;
  resetDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(loadSettingsFromStorage);

  // Temporizador para comprobar la hora en segundo plano si está activa la Opción 1 (auto_schedule)
  useEffect(() => {
    if (settings.preference !== 'auto_schedule') return;

    // Verificar inmediatamente y luego cada 30 segundos
    const checkSchedule = () => {
      const currentTarget = getClinicalScheduledTheme();
      if (settings.theme !== currentTarget) {
        setSettings((prev) => {
          const next = {
            ...prev,
            theme: currentTarget,
          };
          saveSettingsToStorage(next);
          return next;
        });
      }
    };

    checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [settings.preference, settings.theme]);

  // Efecto que aplica los atributos y clases correspondientes a nivel de documento raíz
  useEffect(() => {
    saveSettingsToStorage(settings);

    const root = document.documentElement;
    const body = document.body;

    if (settings.theme === 'clinical_light') {
      root.classList.add('theme-clinical-light');
      root.classList.remove('theme-dark');
      root.setAttribute('data-theme', 'clinical-light');
      body.style.backgroundColor = '#f1f5f9';
      body.style.color = '#0f172a';
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-clinical-light');
      root.setAttribute('data-theme', 'dark');
      body.style.backgroundColor = '#060b16';
      body.style.color = '#f8fafc';
    }

    if (settings.highContrast) {
      root.classList.add('clinical-high-contrast');
    } else {
      root.classList.remove('clinical-high-contrast');
    }

    if (settings.fontSize === 'large') {
      root.classList.add('clinical-font-large');
    } else {
      root.classList.remove('clinical-font-large');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      let nextPref = partial.preference !== undefined ? partial.preference : prev.preference;
      let nextTheme = partial.theme !== undefined ? partial.theme : prev.theme;

      // Si el usuario selecciona explícitamente auto_schedule
      if (partial.preference === 'auto_schedule') {
        nextTheme = getClinicalScheduledTheme();
      } else if (partial.preference) {
        // Selección manual fija tiene prioridad absoluta ('clinical_light' | 'dark')
        nextPref = partial.preference;
        nextTheme = partial.preference;
      } else if (partial.theme && partial.preference === undefined) {
        // Cambio de tema manual recibido directamente
        nextPref = partial.theme;
        nextTheme = partial.theme;
      }

      const updated: UserSettings = {
        ...prev,
        ...partial,
        preference: nextPref,
        theme: nextTheme,
      };
      saveSettingsToStorage(updated);
      return updated;
    });
  };

  /**
   * Fija la preferencia del usuario guardando inmediatamente en localStorage.
   * Si es 'clinical_light' o 'dark', tiene prioridad absoluta sobre el horario automático.
   */
  const setPreference = (pref: ThemePreference) => {
    const nextTheme: ThemeMode = pref === 'auto_schedule' ? getClinicalScheduledTheme() : pref;
    const newSettings: UserSettings = {
      ...settings,
      preference: pref,
      theme: nextTheme,
    };
    saveSettingsToStorage(newSettings);
    setSettings(newSettings);
  };

  /**
   * Al alternar con el botón rápido, se establece la selección manual como prioritaria
   * para respetar la voluntad inmediata del usuario.
   */
  const toggleTheme = () => {
    const nextTheme: ThemeMode = settings.theme === 'clinical_light' ? 'dark' : 'clinical_light';
    const newSettings: UserSettings = {
      ...settings,
      preference: nextTheme, // Prioridad manual
      theme: nextTheme,
    };
    saveSettingsToStorage(newSettings);
    setSettings(newSettings);
  };

  const resetDefaults = () => {
    const reset: UserSettings = {
      ...DEFAULT_SETTINGS,
      preference: 'auto_schedule',
      theme: getClinicalScheduledTheme(),
    };
    saveSettingsToStorage(reset);
    setSettings(reset);
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateSettings,
        toggleTheme,
        setPreference,
        isClinicalLight: settings.theme === 'clinical_light',
        isAutoSchedule: settings.preference === 'auto_schedule',
        resetDefaults,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
};
