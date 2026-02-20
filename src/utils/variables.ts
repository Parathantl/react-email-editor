import type { Variable } from '../types';

const VARIABLE_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;

export function extractVariableKeys(text: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const match of text.matchAll(VARIABLE_REGEX)) {
    const key = match[1].trim();
    if (!seen.has(key)) {
      seen.add(key);
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
    return useSample && variable.sample ? variable.sample : `{{ ${trimmedKey} }}`;
  });
}

/**
 * Convert plain `{{ key }}` text patterns into VariableNode chip HTML
 * so TipTap parses them as atomic variable nodes instead of plain text.
 *
 * Converts: `{{ customer_name }}`
 * To: `<span data-variable-key="customer_name" class="ee-variable-chip" contenteditable="false">{{ customer_name }}</span>`
 *
 * This is the reverse of `stripVariableChips()` in the MJML generator.
 * Only matches `{{ }}` patterns that are NOT already inside a
 * `data-variable-key` span (to avoid double-wrapping).
 */
export function convertVariablesToChips(html: string): string {
  // Skip if no variable patterns exist
  if (!VARIABLE_REGEX.test(html)) return html;
  VARIABLE_REGEX.lastIndex = 0;

  // If the HTML already contains chip spans, skip to avoid double-wrapping
  if (html.includes('data-variable-key')) return html;

  return html.replace(VARIABLE_REGEX, (_match, key: string) => {
    const trimmedKey = key.trim();
    return `<span data-variable-key="${trimmedKey}" class="ee-variable-chip" contenteditable="false">{{ ${trimmedKey} }}</span>`;
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
