import type { PersistenceAdapter, EmailTemplate } from '../types';
import { sanitizeTemplate } from './validate';

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
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Basic schema validation: must have sections array
      if (!parsed || !Array.isArray(parsed.sections)) return null;
      return sanitizeTemplate(parsed);
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
