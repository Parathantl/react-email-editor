import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { VariablePicker, type VariablePickerHandle } from './VariablePicker';
import styles from '../../../styles/properties.module.css';

type LinkType = 'url' | 'email' | 'phone';

function validateLink(value: string, type: LinkType): string | null {
  if (!value) return null;
  // Once the value contains a variable, downstream templating fills it in at
  // send time — we can't shape-check a partial template, so skip validation.
  if (value.includes('{{')) return null;
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email address';
  }
  if (type === 'phone' && !/^[+\d][\d\s\-().]{4,}$/.test(value)) {
    return 'Invalid phone number';
  }
  if (type === 'url' && value && !/^(https?:\/\/|\/|#)/.test(value)) {
    return 'URL should start with https://';
  }
  return null;
}

interface LinkInputProps {
  label: string;
  value: string;
  onChange: (href: string) => void;
}

function detectType(href: string): LinkType {
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('tel:')) return 'phone';
  return 'url';
}

function stripPrefix(href: string, type: LinkType): string {
  if (type === 'email') return href.replace(/^mailto:/, '');
  if (type === 'phone') return href.replace(/^tel:/, '');
  return href;
}

function addPrefix(value: string, type: LinkType): string {
  if (type === 'email' && value && !value.startsWith('mailto:')) return `mailto:${value}`;
  if (type === 'phone' && value && !value.startsWith('tel:')) return `tel:${value}`;
  return value;
}

export function LinkInput({ label, value, onChange }: LinkInputProps) {
  const [type, setType] = useState<LinkType>(() => detectType(value));
  const [rawValue, setRawValue] = useState(() => stripPrefix(value, detectType(value)));
  const validationError = useMemo(() => validateLink(rawValue, type), [rawValue, type]);

  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<VariablePickerHandle>(null);
  const caretRef = useRef<number>(rawValue.length);

  useEffect(() => {
    const detected = detectType(value);
    setType(detected);
    setRawValue(stripPrefix(value, detected));
  }, [value]);

  const handleTypeChange = useCallback(
    (newType: LinkType) => {
      setType(newType);
      onChange(addPrefix(rawValue, newType));
    },
    [rawValue, onChange],
  );

  const handleValueChange = useCallback(
    (newValue: string) => {
      setRawValue(newValue);
      onChange(addPrefix(newValue, type));
    },
    [type, onChange],
  );

  const insertVariableAtCaret = useCallback(
    (key: string) => {
      const token = `{{ ${key} }}`;
      // The default new-button href is '#'. Inserting at caret would produce
      // '#{{ var }}', which is never what the user wants — the '#' is a
      // factory placeholder, not real content. Replace the field entirely
      // when its only content is that lone '#'.
      const isLonePlaceholder = rawValue === '#';
      const caret = isLonePlaceholder ? 0 : caretRef.current;
      const before = isLonePlaceholder ? '' : rawValue.slice(0, caret);
      const after = isLonePlaceholder ? '' : rawValue.slice(caret);
      const next = `${before}${token}${after}`;
      handleValueChange(next);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const newCaret = (isLonePlaceholder ? 0 : caret) + token.length;
        el.setSelectionRange(newCaret, newCaret);
        caretRef.current = newCaret;
      });
    },
    [rawValue, handleValueChange],
  );

  const captureCaret = useCallback(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      caretRef.current = el.selectionStart ?? el.value.length;
    } else {
      caretRef.current = rawValue.length;
    }
  }, [rawValue]);

  const placeholder = type === 'email' ? 'user@example.com'
    : type === 'phone' ? '+1234567890'
    : 'https://';

  return (
    <div className={`ee-field-group ee-link-input ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-field-row-compact']}>
        <select
          className={styles['ee-field-select-narrow']}
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as LinkType)}
        >
          <option value="url">URL</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
        <input
          ref={inputRef}
          className={styles['ee-field-input-flex']}
          value={rawValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={(e) => {
            const handled = pickerRef.current?.handleHostKeyDown(e.nativeEvent);
            if (handled) e.preventDefault();
          }}
          onSelect={(e) => {
            const el = e.currentTarget;
            caretRef.current = el.selectionStart ?? el.value.length;
          }}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={!!validationError}
        />
        <VariablePicker
          ref={pickerRef}
          onInsert={insertVariableAtCaret}
          onBeforeOpen={captureCaret}
          hostRef={inputRef}
        />
      </div>
      {validationError && (
        <span className={`ee-validation-error ${styles['ee-validation-error']}`} role="alert">
          {validationError}
        </span>
      )}
    </div>
  );
}
