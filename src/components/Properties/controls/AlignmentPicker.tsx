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
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.alignmentPicker}>
        {options.map((option) => (
          <button
            key={option}
            className={`${styles.alignmentBtn} ${
              value === option ? styles.alignmentBtnActive : ''
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
