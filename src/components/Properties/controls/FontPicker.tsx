import React from 'react';
import { FONT_OPTIONS } from '../../../constants';
import styles from '../../../styles/properties.module.css';

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
}

export function FontPicker({ label, value, onChange }: FontPickerProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <select
        className={styles.fieldSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {FONT_OPTIONS.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font.split(',')[0].trim()}
          </option>
        ))}
      </select>
    </div>
  );
}
