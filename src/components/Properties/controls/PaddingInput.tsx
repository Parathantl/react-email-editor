import React, { useCallback, useMemo } from 'react';
import styles from '../../../styles/properties.module.css';

interface PaddingInputProps {
  label: string;
  value: string;
  onChange: (padding: string) => void;
}

function parsePadding(value: string): [string, string, string, string] {
  const parts = value.split(/\s+/).map((p) => p.trim()).filter(Boolean);
  switch (parts.length) {
    case 1:
      return [parts[0], parts[0], parts[0], parts[0]];
    case 2:
      return [parts[0], parts[1], parts[0], parts[1]];
    case 3:
      return [parts[0], parts[1], parts[2], parts[1]];
    case 4:
      return [parts[0], parts[1], parts[2], parts[3]];
    default:
      return ['0px', '0px', '0px', '0px'];
  }
}

export function PaddingInput({ label, value, onChange }: PaddingInputProps) {
  const [top, right, bottom, left] = useMemo(() => parsePadding(value), [value]);

  const handleChange = useCallback(
    (position: 'top' | 'right' | 'bottom' | 'left', newVal: string) => {
      const parts = parsePadding(value);
      const idx = { top: 0, right: 1, bottom: 2, left: 3 }[position];
      parts[idx] = newVal || '0px';
      onChange(parts.join(' '));
    },
    [value, onChange],
  );

  return (
    <div className={`ee-field-group ee-padding ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-padding-grid']}>
        <div className={styles['ee-padding-field']}>
          <span className={styles['ee-padding-label']}>Top</span>
          <input
            className={styles['ee-padding-input']}
            value={top}
            onChange={(e) => handleChange('top', e.target.value)}
          />
        </div>
        <div className={styles['ee-padding-field']}>
          <span className={styles['ee-padding-label']}>Right</span>
          <input
            className={styles['ee-padding-input']}
            value={right}
            onChange={(e) => handleChange('right', e.target.value)}
          />
        </div>
        <div className={styles['ee-padding-field']}>
          <span className={styles['ee-padding-label']}>Bottom</span>
          <input
            className={styles['ee-padding-input']}
            value={bottom}
            onChange={(e) => handleChange('bottom', e.target.value)}
          />
        </div>
        <div className={styles['ee-padding-field']}>
          <span className={styles['ee-padding-label']}>Left</span>
          <input
            className={styles['ee-padding-input']}
            value={left}
            onChange={(e) => handleChange('left', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
