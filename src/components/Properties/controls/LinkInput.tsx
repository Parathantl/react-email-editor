import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styles from '../../../styles/properties.module.css';

type LinkType = 'url' | 'email' | 'phone';

function validateLink(value: string, type: LinkType): string | null {
  if (!value) return null;
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

  const placeholder = type === 'email' ? 'user@example.com'
    : type === 'phone' ? '+1234567890'
    : 'https://';

  return (
    <div className={`ee-field-group ee-link-input ${styles.fieldGroup}`}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldRowCompact}>
        <select
          className={styles.fieldSelectNarrow}
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as LinkType)}
        >
          <option value="url">URL</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
        <input
          className={styles.fieldInputFlex}
          value={rawValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={!!validationError}
        />
      </div>
      {validationError && (
        <span className={`ee-validation-error ${styles.validationError}`} role="alert">
          {validationError}
        </span>
      )}
    </div>
  );
}
