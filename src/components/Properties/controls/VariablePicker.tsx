import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useEditorVariables } from '../../../context/EditorContext';
import {
  SafeVariableSuggestionPopup,
  type VariableSuggestionPopupHandle,
} from '../../Canvas/blocks/VariableSuggestionPopup';
import type { Variable } from '../../../types';
import styles from '../../../styles/properties.module.css';

function sanitizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export interface VariablePickerHandle {
  /** Forward a keydown event from a host input. Returns true if the picker
   *  consumed the event (caller should preventDefault). */
  handleHostKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VariablePickerProps {
  /** Called when the user selects an existing variable or creates a new one. */
  onInsert: (key: string) => void;
  /** Called just before the popup opens; use to snapshot the host's caret. */
  onBeforeOpen?: () => void;
  /** Optional host element (typically the parent input) whose clicks should
   *  not dismiss the popup — keeps the picker open while the user re-clicks
   *  the input to reposition the caret. */
  hostRef?: RefObject<HTMLElement>;
}

/**
 * Trigger button + popup combo used by `VariableTextInput` and `LinkInput`.
 * Owns the popup's open/close, search, positioning, and outside-click
 * dismissal. Insertion-at-caret is the host's responsibility — the picker
 * just emits `onInsert(key)`.
 */
export const VariablePicker = forwardRef<VariablePickerHandle, VariablePickerProps>(
  function VariablePicker({ onInsert, onBeforeOpen, hostRef }, ref) {
    const { variables, addCustomVariable } = useEditorVariables();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<VariableSuggestionPopupHandle>(null);
    const popupContainerRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    const items = useMemo(() => {
      const lower = query.toLowerCase().trim();
      if (!lower) return variables.slice(0, 8);
      return variables
        .filter(
          (v) =>
            v.key.toLowerCase().includes(lower) ||
            (v.label?.toLowerCase().includes(lower) ?? false),
        )
        .slice(0, 8);
    }, [variables, query]);

    const createKey = useMemo(() => sanitizeKey(query), [query]);
    const canCreate = createKey.length > 0 && !variables.some((v) => v.key === createKey);

    const closePopup = useCallback(() => {
      setOpen(false);
      setQuery('');
    }, []);

    const handleSelect = useCallback(
      (variable: Variable) => {
        onInsert(variable.key);
        closePopup();
      },
      [onInsert, closePopup],
    );

    const handleCreate = useCallback(
      (key: string) => {
        // Mirror VariableSuggestion's inline-create: leave `label` undefined so
        // displayVariableName() humanises the snake_case key.
        const existing = variables.find((v) => v.key === key);
        const variable: Variable = existing ?? { key, group: 'Custom' };
        if (!existing) addCustomVariable(variable);
        onInsert(variable.key);
        closePopup();
      },
      [variables, addCustomVariable, onInsert, closePopup],
    );

    const command = useCallback(
      (cmd: { type: 'select'; variable: Variable } | { type: 'create'; key: string }) => {
        if (cmd.type === 'select') handleSelect(cmd.variable);
        else handleCreate(cmd.key);
      },
      [handleSelect, handleCreate],
    );

    // Position the popup beneath the trigger button. Measures the popup's
    // actual size after it mounts (rather than guessing) so it doesn't
    // overflow when the list grows. Mirrors tiptap/VariableSuggestion.ts.
    useEffect(() => {
      if (!open) return;
      const reposition = () => {
        const trigger = triggerRef.current;
        const popup = popupContainerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const popupHeight = popup?.offsetHeight || 240;
        const popupWidth = popup?.offsetWidth || 300;
        const showAbove =
          window.innerHeight - rect.bottom < popupHeight + 8 && rect.top > popupHeight + 8;
        let left = rect.right - popupWidth;
        left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8));
        const top = showAbove ? rect.top - popupHeight - 4 : rect.bottom + 4;
        setPosition({ top, left });
      };
      reposition();
      const raf = requestAnimationFrame(reposition);
      window.addEventListener('resize', reposition);
      window.addEventListener('scroll', reposition, true);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition, true);
      };
    }, [open, items.length, canCreate]);

    // Dismiss the popup when a click lands outside the trigger, the popup,
    // and (optionally) the host input.
    useEffect(() => {
      if (!open) return;
      const handlePointer = (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (triggerRef.current?.contains(target)) return;
        if (hostRef?.current?.contains(target)) return;
        const inPopup = (target as HTMLElement).closest?.('[data-ee-variable-popup="true"]');
        if (inPopup) return;
        closePopup();
      };
      document.addEventListener('mousedown', handlePointer);
      return () => document.removeEventListener('mousedown', handlePointer);
    }, [open, hostRef, closePopup]);

    useImperativeHandle(
      ref,
      () => ({
        handleHostKeyDown: (event: KeyboardEvent) => {
          if (!open) return false;
          if (event.key === 'Escape') {
            closePopup();
            return true;
          }
          if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(event.key)) {
            return popupRef.current?.onKeyDown(event) ?? false;
          }
          return false;
        },
      }),
      [open, closePopup],
    );

    const handleTriggerMouseDown = useCallback(() => {
      onBeforeOpen?.();
    }, [onBeforeOpen]);

    const handleTriggerClick = useCallback(() => {
      setOpen((prev) => !prev);
      setQuery('');
    }, []);

    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          className={`ee-variable-trigger ${styles['ee-variable-trigger']}`}
          onMouseDown={handleTriggerMouseDown}
          onClick={handleTriggerClick}
          title="Insert variable"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {'{ }'}
        </button>
        {open &&
          createPortal(
            <div
              ref={popupContainerRef}
              data-ee-variable-popup="true"
              className={styles['ee-variable-popover']}
              style={{
                position: 'fixed',
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                zIndex: 10000,
              }}
            >
              <div className={styles['ee-variable-popover-search']}>
                <input
                  autoFocus
                  className={styles['ee-variable-popover-search-input']}
                  value={query}
                  placeholder="Search variables…"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      closePopup();
                      return;
                    }
                    if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(event.key)) {
                      const handled = popupRef.current?.onKeyDown(event.nativeEvent);
                      if (handled) event.preventDefault();
                    }
                  }}
                />
              </div>
              <SafeVariableSuggestionPopup
                ref={popupRef}
                items={items}
                query={query}
                canCreate={canCreate}
                createKey={createKey}
                command={command}
              />
            </div>,
            document.body,
          )}
      </>
    );
  },
);
