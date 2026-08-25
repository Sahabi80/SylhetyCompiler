/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';

interface UseAutoSaveOptions {
  key?: string;
  delayMs?: number;
  onSave?: (savedCode: string) => void;
}

interface UseAutoSaveReturn {
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveNow: () => void;
  clearSavedCode: () => void;
}

const DEFAULT_STORAGE_KEY = 'sylhetilang_autosave_code';
const DEFAULT_DELAY_MS = 1500; // Auto-save after 1.5 seconds of inactivity

/**
 * Custom hook to automatically persist and restore source code in LocalStorage.
 * Prevents loss of work across browser refreshes or accidental tab closes.
 */
export function useAutoSave(
  defaultInitialCode: string,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    key = DEFAULT_STORAGE_KEY,
    delayMs = DEFAULT_DELAY_MS,
    onSave,
  } = options;

  // Initialize state from LocalStorage if available, fallback to initial default
  const [code, setCode] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null && stored.trim().length > 0) {
        return stored;
      }
    } catch (err) {
      console.warn('Unable to access localStorage for auto-save retrieval:', err);
    }
    return defaultInitialCode;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? new Date() : null;
    } catch {
      return null;
    }
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCodeRef = useRef<string>(code);

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  // Immediate save execution
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      setIsSaving(true);
      localStorage.setItem(key, latestCodeRef.current);
      const now = new Date();
      setLastSavedAt(now);
      if (onSave) {
        onSave(latestCodeRef.current);
      }
    } catch (err) {
      console.warn('Auto-save to localStorage failed:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  }, [key, onSave]);

  // Clear saved code
  const clearSavedCode = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setLastSavedAt(null);
    } catch (err) {
      console.warn('Failed to clear auto-saved code from localStorage:', err);
    }
  }, [key]);

  // Auto-save effect on code change with debounce
  useEffect(() => {
    setIsSaving(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, code);
        const now = new Date();
        setLastSavedAt(now);
        if (onSave) {
          onSave(code);
        }
      } catch (err) {
        console.warn('Auto-save to localStorage failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [code, key, delayMs, onSave]);

  return {
    code,
    setCode,
    isSaving,
    lastSavedAt,
    saveNow,
    clearSavedCode,
  };
}
