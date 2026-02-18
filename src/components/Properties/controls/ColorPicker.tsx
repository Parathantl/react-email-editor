import React, { useState, useCallback, useRef, useEffect } from 'react';
import { COLOR_PRESETS } from '../../../constants';
import styles from '../../../styles/properties.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.colorPickerWrapper} ref={wrapperRef}>
        <div
          className={styles.colorPickerTrigger}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.colorSwatch} style={{ backgroundColor: value }} />
          <span className={styles.colorValue}>{value}</span>
        </div>
        {isOpen && (
          <div className={styles.colorPresets}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`${styles.colorPresetBtn} ${
                  color === value ? styles.colorPresetBtnActive : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
                title={color}
              />
            ))}
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '100%', gridColumn: '1 / -1', height: 28, cursor: 'pointer', border: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
