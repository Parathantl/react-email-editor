import { useCallback, useEffect, useRef } from 'react';
import type { EmailTemplate, PersistenceAdapter } from '../types';
import { localStorageAdapter } from '../utils/persistence';

interface UsePersistenceOptions {
  template: EmailTemplate;
  persistenceKey?: string;
  persistenceAdapter?: PersistenceAdapter;
}

interface UsePersistenceResult {
  clearPersisted: () => void;
}

export function usePersistence({
  template,
  persistenceKey,
  persistenceAdapter,
}: UsePersistenceOptions): UsePersistenceResult {
  const persistenceKeyRef = useRef(persistenceKey);
  persistenceKeyRef.current = persistenceKey;
  const persistenceAdapterRef = useRef(persistenceAdapter);
  persistenceAdapterRef.current = persistenceAdapter;

  // Debounced auto-save to persistence (500ms)
  const isFirstPersistRender = useRef(true);
  useEffect(() => {
    if (isFirstPersistRender.current) {
      isFirstPersistRender.current = false;
      return;
    }
    const key = persistenceKeyRef.current;
    if (!key) return;
    const adapter = persistenceAdapterRef.current ?? localStorageAdapter;
    const timer = setTimeout(() => {
      adapter.save(key, template);
    }, 500);
    return () => clearTimeout(timer);
  }, [template]);

  const clearPersisted = useCallback(() => {
    if (!persistenceKeyRef.current) return;
    const adapter = persistenceAdapterRef.current ?? localStorageAdapter;
    adapter.remove(persistenceKeyRef.current);
  }, []);

  return { clearPersisted };
}
