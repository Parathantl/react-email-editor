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

  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className={`ee-field-group ee-color-picker ${styles.fieldGroup}`}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.colorPickerWrapper} ref={wrapperRef}>
        <div
          className={styles.colorPickerTrigger}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div
            className={`${styles.colorSwatch} ${value === 'transparent' ? styles.colorSwatchTransparent : ''}`}
            style={value !== 'transparent' ? { backgroundColor: value || 'transparent' } : undefined}
          />
          <span className={styles.colorValue}>{value || 'transparent'}</span>
        </div>
        {isOpen && (
          <div className={styles.colorPresets}>
            <button
              className={`ee-color-preset-transparent ${styles.colorPresetBtn} ${styles.colorPresetBtnTransparent} ${styles.colorPresetBtnFull} ${
                value === 'transparent' ? styles.colorPresetBtnActive : ''
              }`}
              onClick={() => handlePresetClick('transparent')}
              title="transparent"
            >
              Transparent
            </button>
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
              className={`ee-color-native-input ${styles.colorNativeInput}`}
              value={isHex ? value : '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
