import React from 'react';
import styles from '../../../styles/properties.module.css';

interface AlignmentPickerProps {
  label: string;
  value: string;
  onChange: (align: string) => void;
  options?: string[];
}

const ALIGN_ICONS: Record<string, string> = {
  left: '\u2261',
  center: '\u2261',
  right: '\u2261',
  justify: '\u2261',
};

export function AlignmentPicker({
  label,
  value,
  onChange,
  options = ['left', 'center', 'right'],
}: AlignmentPickerProps) {
  return (
    <div className={`ee-field-group ee-alignment ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-alignment-picker']}>
        {options.map((option) => (
          <button
            key={option}
            className={`${styles['ee-alignment-btn']} ${
              value === option ? styles['ee-alignment-btn-active'] : ''
            }`}
            onClick={() => onChange(option)}
            title={option.charAt(0).toUpperCase() + option.slice(1)}
          >
            {option.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
