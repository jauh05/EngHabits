import { MotionConfig } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from './db';

type SettingsContextValue = {
  settings: Settings;
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Pengaturan aplikasi. Disimpan di IndexedDB. Jika IndexedDB gagal, pakai default di memori.
 * Mengatur tema, atribut data-reduce-motion, dan MotionConfig.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getSettings()
      .then((stored) => {
        if (active) setSettings(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings.theme, settings.reduceMotion]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update]);

  return (
    <SettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings harus dipakai di dalam SettingsProvider');
  return ctx;
}
