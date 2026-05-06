import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Variable } from '../../../types';
import { displayVariableName, groupVariables } from '../../../utils/variables';
import styles from '../../../styles/variableSuggestion.module.css';

export interface VariableSuggestionPopupHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export type VariableSuggestionCommand =
  | { type: 'select'; variable: Variable }
  | { type: 'create'; key: string };

interface PopupProps {
  items: Variable[];
  query: string;
  canCreate: boolean;
  createKey: string;
  command: (command: VariableSuggestionCommand) => void;
}

interface FlatRow {
  type: 'header' | 'item' | 'create';
  group?: string;
  variable?: Variable;
  selectableIndex?: number;
}

export const VariableSuggestionPopup = forwardRef<VariableSuggestionPopupHandle, PopupProps>(
  function VariableSuggestionPopup({ items, query, canCreate, createKey, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedIndexRef = useRef(0);
    const itemsRef = useRef(items);
    const canCreateRef = useRef(canCreate);
    const createKeyRef = useRef(createKey);
    const commandRef = useRef(command);
    const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
    itemsRef.current = items;
    canCreateRef.current = canCreate;
    createKeyRef.current = createKey;
    commandRef.current = command;

    const setSelected = (i: number) => {
      selectedIndexRef.current = i;
      setSelectedIndex(i);
    };

    // Build the visible rows: when there's a query, show a flat filtered list
    // (no group headers); when empty, group by the variable's `group` field.
    const rows = useMemo<FlatRow[]>(() => {
      const result: FlatRow[] = [];
      let selectable = 0;
      const isSearching = query.trim().length > 0;
      if (isSearching || items.length === 0) {
        for (const v of items) {
          result.push({ type: 'item', variable: v, selectableIndex: selectable++ });
        }
      } else {
        const groups = groupVariables(items);
        for (const [group, vars] of groups) {
          result.push({ type: 'header', group });
          for (const v of vars) {
            result.push({ type: 'item', variable: v, selectableIndex: selectable++ });
          }
        }
      }
      if (canCreate) {
        result.push({ type: 'create', selectableIndex: selectable++ });
      }
      return result;
    }, [items, query, canCreate]);

    const totalSelectable = items.length + (canCreate ? 1 : 0);

    useEffect(() => {
      setSelected(0);
    }, [items, canCreate]);

    // Keep the selected row scrolled into view on keyboard nav.
    useEffect(() => {
      const el = rowRefs.current.get(selectedIndex);
      el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const select = (index: number) => {
      const len = itemsRef.current.length;
      const max = len + (canCreateRef.current ? 1 : 0);
      if (index < 0 || index >= max) return;
      if (index < len) {
        commandRef.current({ type: 'select', variable: itemsRef.current[index] });
      } else {
        commandRef.current({ type: 'create', key: createKeyRef.current });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        const len = itemsRef.current.length;
        const max = len + (canCreateRef.current ? 1 : 0);
        if (max === 0) return false;
        if (event.key === 'ArrowUp') {
          setSelected((selectedIndexRef.current + max - 1) % max);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelected((selectedIndexRef.current + 1) % max);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          select(selectedIndexRef.current);
          return true;
        }
        return false;
      },
    }));

    const empty = totalSelectable === 0;

    return (
      <div className={`ee-variable-suggestion ${styles['ee-variable-suggestion']}`}>
        <div className={styles['ee-variable-suggestion-list']} role="listbox">
          {empty && (
            <div className={styles['ee-variable-suggestion-empty']}>
              {query
                ? `No variables match "${query}"`
                : 'No variables available'}
            </div>
          )}
          {rows.map((row, i) => {
            if (row.type === 'header') {
              return (
                <div key={`h-${row.group}-${i}`} className={styles['ee-variable-suggestion-group']}>
                  {row.group}
                </div>
              );
            }
            if (row.type === 'create') {
              const idx = row.selectableIndex!;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  type="button"
                  key="__create"
                  ref={(el) => {
                    if (el) rowRefs.current.set(idx, el);
                    else rowRefs.current.delete(idx);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles['ee-variable-suggestion-item']} ${styles['ee-variable-suggestion-item-create']} ${isSelected ? styles['ee-variable-suggestion-item-selected'] : ''}`}
                  onMouseEnter={() => setSelected(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commandRef.current({ type: 'create', key: createKeyRef.current });
                  }}
                >
                  <span className={styles['ee-variable-suggestion-icon']}>+</span>
                  <span className={styles['ee-variable-suggestion-text']}>
                    <span className={styles['ee-variable-suggestion-label']}>
                      Create variable
                    </span>
                    <span className={styles['ee-variable-suggestion-key']}>
                      {`{{ ${createKey} }}`}
                    </span>
                  </span>
                </button>
              );
            }
            const v = row.variable!;
            const idx = row.selectableIndex!;
            const isSelected = idx === selectedIndex;
            return (
              <button
                type="button"
                key={v.key}
                ref={(el) => {
                  if (el) rowRefs.current.set(idx, el);
                  else rowRefs.current.delete(idx);
                }}
                role="option"
                aria-selected={isSelected}
                className={`${styles['ee-variable-suggestion-item']} ${isSelected ? styles['ee-variable-suggestion-item-selected'] : ''}`}
                onMouseEnter={() => setSelected(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commandRef.current({ type: 'select', variable: v });
                }}
              >
                <span className={styles['ee-variable-suggestion-icon']}>
                  {v.icon ?? '{ }'}
                </span>
                <span className={styles['ee-variable-suggestion-text']}>
                  <span className={styles['ee-variable-suggestion-label']}>
                    {displayVariableName(v)}
                  </span>
                  <span className={styles['ee-variable-suggestion-key']}>
                    {`{{ ${v.key} }}`}
                    {v.sample && (
                      <>
                        <span className={styles['ee-variable-suggestion-dot']}>·</span>
                        <span className={styles['ee-variable-suggestion-sample']}>{v.sample}</span>
                      </>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {!empty && (
          <div className={styles['ee-variable-suggestion-footer']}>
            <kbd>↑↓</kbd> navigate
            <span className={styles['ee-variable-suggestion-footer-sep']}>·</span>
            <kbd>↵</kbd> select
            <span className={styles['ee-variable-suggestion-footer-sep']}>·</span>
            <kbd>esc</kbd> cancel
          </div>
        )}
      </div>
    );
  }
);
