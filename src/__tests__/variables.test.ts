import { describe, it, expect } from 'vitest';
import { extractVariableKeys, replaceVariables, groupVariables } from '../utils/variables';
import type { Variable } from '../types';

describe('extractVariableKeys', () => {
  it('extracts simple variable keys', () => {
    const keys = extractVariableKeys('Hello {{ name }}, welcome!');
    expect(keys).toEqual(['name']);
  });

  it('extracts multiple variable keys', () => {
    const keys = extractVariableKeys('{{ first_name }} {{ last_name }}');
    expect(keys).toEqual(['first_name', 'last_name']);
  });

  it('deduplicates variable keys', () => {
    const keys = extractVariableKeys('{{ name }} and {{ name }}');
    expect(keys).toEqual(['name']);
  });

  it('handles variables with extra whitespace', () => {
    const keys = extractVariableKeys('{{  name  }}');
    expect(keys).toEqual(['name']);
  });

  it('returns empty array when no variables', () => {
    const keys = extractVariableKeys('No variables here');
    expect(keys).toEqual([]);
  });

  it('handles empty string', () => {
    const keys = extractVariableKeys('');
    expect(keys).toEqual([]);
  });

  it('extracts from multiline content', () => {
    const keys = extractVariableKeys('<p>Hello {{ name }}</p>\n<p>Your order {{ order_id }}</p>');
    expect(keys).toEqual(['name', 'order_id']);
  });
});

describe('replaceVariables', () => {
  const variables: Variable[] = [
    { key: 'name', sample: 'John Doe' },
    { key: 'email', sample: 'john@example.com' },
  ];

  it('replaces variables with sample values', () => {
    const result = replaceVariables('Hello {{ name }}!', variables);
    expect(result).toBe('Hello John Doe!');
  });

  it('replaces multiple variables', () => {
    const result = replaceVariables('{{ name }} ({{ email }})', variables);
    expect(result).toBe('John Doe (john@example.com)');
  });

  it('preserves unknown variables', () => {
    const result = replaceVariables('Hello {{ unknown }}!', variables);
    expect(result).toBe('Hello {{ unknown }}!');
  });

  it('returns original text when useSample is false', () => {
    const result = replaceVariables('Hello {{ name }}!', variables, false);
    expect(result).toBe('Hello {{ name }}!');
  });
});

describe('groupVariables', () => {
  it('groups variables by group property', () => {
    const vars: Variable[] = [
      { key: 'name', sample: 'John', group: 'User' },
      { key: 'email', sample: 'john@x.com', group: 'User' },
      { key: 'order', sample: '#123', group: 'Order' },
    ];
    const groups = groupVariables(vars);
    expect(groups.get('User')).toHaveLength(2);
    expect(groups.get('Order')).toHaveLength(1);
  });

  it('uses "General" as default group', () => {
    const vars: Variable[] = [
      { key: 'name', sample: 'John' },
    ];
    const groups = groupVariables(vars);
    expect(groups.get('General')).toHaveLength(1);
  });
});
