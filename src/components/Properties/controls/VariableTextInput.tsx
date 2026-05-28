import { useCallback, useRef } from 'react';
import { VariablePicker, type VariablePickerHandle } from './VariablePicker';
import styles from '../../../styles/properties.module.css';

interface VariableTextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Text input paired with a variable picker. Selecting (or creating) a
 * variable splices `{{ key }}` into the value at the input's caret.
 */
export function VariableTextInput({ label, value, onChange, placeholder }: VariableTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<VariablePickerHandle>(null);
  // Cache the caret position. Focusing the trigger button collapses the
  // input's selection, so we snapshot it on every selection event and on
  // the trigger's mousedown.
  const caretRef = useRef<number>(value.length);

  const insertAtCaret = useCallback(
    (key: string) => {
      const caret = caretRef.current;
      const before = value.slice(0, caret);
      const after = value.slice(caret);
      const token = `{{ ${key} }}`;
      const next = `${before}${token}${after}`;
      onChange(next);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const newCaret = caret + token.length;
        el.setSelectionRange(newCaret, newCaret);
        caretRef.current = newCaret;
      });
    },
    [value, onChange],
  );

  const captureCaret = useCallback(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      caretRef.current = el.selectionStart ?? el.value.length;
    } else {
      caretRef.current = value.length;
    }
  }, [value]);

  return (
    <div className={`ee-field-group ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-field-row-compact']}>
        <input
          ref={inputRef}
          className={styles['ee-field-input-flex']}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            const handled = pickerRef.current?.handleHostKeyDown(e.nativeEvent);
            if (handled) e.preventDefault();
          }}
          onSelect={(e) => {
            const el = e.currentTarget;
            caretRef.current = el.selectionStart ?? el.value.length;
          }}
        />
        <VariablePicker
          ref={pickerRef}
          onInsert={insertAtCaret}
          onBeforeOpen={captureCaret}
          hostRef={inputRef}
        />
      </div>
    </div>
  );
}
