import type { PersistenceAdapter, EmailTemplate } from '../types';

/**
 * Default persistence adapter using localStorage.
 * All operations are wrapped in try/catch to handle quota errors,
 * private browsing restrictions, and SSR environments.
 */
export const localStorageAdapter: PersistenceAdapter = {
  save(key: string, template: EmailTemplate): void {
    try {
      localStorage.setItem(key, JSON.stringify(template));
    } catch {
      // Silently fail — quota exceeded, private browsing, or SSR
    }
  },

  load(key: string): EmailTemplate | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
};
