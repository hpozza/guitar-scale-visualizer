import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearStoredSettings,
  DEFAULT_SETTINGS,
  readStoredSettings,
  writeStoredSettings,
  type Settings,
} from './settings';

export type SettingsStatus = 'loading' | 'ready' | 'error';

export interface SettingsController {
  settings: Settings;
  status: SettingsStatus;
  /** Set when saved settings could not be read, e.g. a corrupt payload. */
  error: string | null;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** Continue with defaults after a read error. */
  dismissError: () => void;
  /** False when settings cannot be written, e.g. storage is unavailable. */
  persisted: boolean;
}

export function useSettings(): SettingsController {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<SettingsStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(true);
  const hydrated = useRef(false);

  // Saved settings are applied after the first paint: the shell can render its
  // skeleton immediately, and a storage failure becomes a recoverable state
  // instead of an exception thrown during render.
  useEffect(() => {
    try {
      // oxlint-disable-next-line react/set-state-in-effect -- localStorage is the external system being read.
      setSettings(readStoredSettings());
      setStatus('ready');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Saved settings could not be read (${cause.message}).`
          : 'Saved settings could not be read.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    try {
      writeStoredSettings(settings);
      // oxlint-disable-next-line react/set-state-in-effect -- reports the result of the write to localStorage.
      setPersisted(true);
    } catch {
      setPersisted(false);
    }
  }, [settings, status]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    try {
      clearStoredSettings();
    } catch {
      setPersisted(false);
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const dismissError = useCallback(() => {
    try {
      clearStoredSettings();
    } catch {
      setPersisted(false);
    }
    setSettings(DEFAULT_SETTINGS);
    setError(null);
    setStatus('ready');
  }, []);

  return useMemo(
    () => ({ settings, status, error, update, reset, dismissError, persisted }),
    [settings, status, error, update, reset, dismissError, persisted],
  );
}
