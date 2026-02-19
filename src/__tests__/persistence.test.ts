import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localStorageAdapter } from '../utils/persistence';
import { sanitizeTemplate } from '../utils/validate';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';
import type { EmailTemplate, PersistenceAdapter } from '../types';

const VALID_TEMPLATE: EmailTemplate = {
  sections: [],
  globalStyles: { ...DEFAULT_GLOBAL_STYLES },
  headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
};

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads a template', () => {
    localStorageAdapter.save('test-key', VALID_TEMPLATE);
    const loaded = localStorageAdapter.load('test-key');
    expect(loaded).not.toBeNull();
    expect(loaded!.sections).toEqual([]);
    expect(loaded!.globalStyles).toEqual(VALID_TEMPLATE.globalStyles);
  });

  it('returns null for missing key', () => {
    const loaded = localStorageAdapter.load('nonexistent');
    expect(loaded).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem('bad-key', 'not json');
    const loaded = localStorageAdapter.load('bad-key');
    expect(loaded).toBeNull();
  });

  it('returns null for data without sections array', () => {
    localStorage.setItem('bad-data', JSON.stringify({ foo: 'bar' }));
    const loaded = localStorageAdapter.load('bad-data');
    expect(loaded).toBeNull();
  });

  it('removes stored data', () => {
    localStorageAdapter.save('remove-key', VALID_TEMPLATE);
    localStorageAdapter.remove('remove-key');
    const loaded = localStorageAdapter.load('remove-key');
    expect(loaded).toBeNull();
  });

  it('handles save errors gracefully', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota exceeded'); };
    expect(() => localStorageAdapter.save('key', VALID_TEMPLATE)).not.toThrow();
    Storage.prototype.setItem = originalSetItem;
  });

  it('handles remove errors gracefully', () => {
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { throw new Error('error'); };
    expect(() => localStorageAdapter.remove('key')).not.toThrow();
    Storage.prototype.removeItem = originalRemoveItem;
  });
});

describe('localStorageAdapter sanitizes on load', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies sanitizeTemplate to loaded data (fills missing globalStyles)', () => {
    // Store data with missing globalStyles
    const raw = { sections: [], /* no globalStyles */ };
    localStorage.setItem('sanitize-test', JSON.stringify(raw));
    const loaded = localStorageAdapter.load('sanitize-test');
    expect(loaded).not.toBeNull();
    expect(loaded!.globalStyles).toBeDefined();
    expect(loaded!.globalStyles.backgroundColor).toBe(DEFAULT_GLOBAL_STYLES.backgroundColor);
  });

  it('strips invalid blocks from loaded data', () => {
    const raw = {
      sections: [{
        id: 's1',
        columns: [{
          id: 'c1',
          width: '100%',
          blocks: [
            { id: 'b1', type: 'text', properties: { content: 'valid' } },
            { id: 'b2', type: 'nonexistent_type_xyz', properties: {} }, // invalid type
          ],
        }],
        properties: { backgroundColor: '#fff', padding: '20px 0', borderRadius: '0px', fullWidth: false },
      }],
    };
    localStorage.setItem('strip-test', JSON.stringify(raw));
    const loaded = localStorageAdapter.load('strip-test');
    expect(loaded).not.toBeNull();
    // Invalid block type should be stripped by sanitizeTemplate
    expect(loaded!.sections[0].columns[0].blocks).toHaveLength(1);
    expect(loaded!.sections[0].columns[0].blocks[0].type).toBe('text');
  });
});

describe('sanitizeTemplate with persistence data', () => {
  it('sanitizes partially valid persisted data', () => {
    const data = {
      sections: [
        {
          id: 's1',
          columns: [{ id: 'c1', width: '100%', blocks: [{ id: 'b1', type: 'text', properties: { content: 'hello' } }] }],
          properties: { backgroundColor: '#fff' },
        },
      ],
      // missing globalStyles and headMetadata
    };
    const result = sanitizeTemplate(data);
    expect(result.sections).toHaveLength(1);
    expect(result.globalStyles).toBeDefined();
    expect(result.headMetadata).toBeDefined();
  });
});

describe('async persistence adapter', () => {
  it('can be used for save/remove operations', async () => {
    const store: Record<string, string> = {};
    const adapter: PersistenceAdapter = {
      save: async (key, template) => { store[key] = JSON.stringify(template); },
      load: (key) => { const d = store[key]; return d ? JSON.parse(d) : null; },
      remove: async (key) => { delete store[key]; },
    };

    await adapter.save('key', VALID_TEMPLATE);
    const loaded = adapter.load('key');
    expect(loaded).not.toBeNull();
    await adapter.remove('key');
    expect(adapter.load('key')).toBeNull();
  });
});
