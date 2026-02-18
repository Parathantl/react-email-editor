import type { Variable } from '../types';

const VARIABLE_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;

export function extractVariableKeys(text: string): string[] {
  const keys: string[] = [];
  for (const match of text.matchAll(VARIABLE_REGEX)) {
    const key = match[1].trim();
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys;
}

export function replaceVariables(
  text: string,
  variables: Variable[],
  useSample = true,
): string {
  return text.replace(VARIABLE_REGEX, (_match, key: string) => {
    const trimmedKey = key.trim();
    const variable = variables.find((v) => v.key === trimmedKey);
    if (!variable) return `{{ ${trimmedKey} }}`;
    return useSample ? variable.sample : `{{ ${trimmedKey} }}`;
  });
}

export function groupVariables(variables: Variable[]): Map<string, Variable[]> {
  const groups = new Map<string, Variable[]>();
  for (const variable of variables) {
    const group = variable.group ?? 'General';
    const existing = groups.get(group) ?? [];
    existing.push(variable);
    groups.set(group, existing);
  }
  return groups;
}
