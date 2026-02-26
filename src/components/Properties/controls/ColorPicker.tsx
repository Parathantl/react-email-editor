import React, { useState, useCallback, useRef, useEffect } from 'react';
import { COLOR_PRESETS } from '../../../constants';
import { useColorPresets } from '../../../context/EditorContext';
import { HslColorArea } from '../../shared/HslColorArea';
import styles from '../../../styles/properties.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { customColorPresets, addCustomColorPreset, removeCustomColorPreset } = useColorPresets();

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

  const handleSavePreset = useCallback(() => {
    if (value && value !== 'transparent' && !customColorPresets.includes(value)) {
      addCustomColorPreset(value);
    }
  }, [value, customColorPresets, addCustomColorPreset]);

  const handlePresetContextMenu = useCallback(
    (e: React.MouseEvent, color: string) => {
      e.preventDefault();
      removeCustomColorPreset(color);
    },
    [removeCustomColorPreset],
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
            {customColorPresets.length > 0 && (
              <>
                <div className={`${styles.colorPresetBtnFull} ${styles.colorPresetSectionLabel}`}>Custom</div>
                {customColorPresets.map((color) => (
                  <button
                    key={`custom-${color}`}
                    className={`${styles.colorPresetBtn} ${
                      color === value ? styles.colorPresetBtnActive : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetClick(color)}
                    onContextMenu={(e) => handlePresetContextMenu(e, color)}
                    title={`${color} (right-click to remove)`}
                  />
                ))}
              </>
            )}
            <div className={`${styles.colorPresetBtnFull}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
              <HslColorArea
                value={isHex ? value : '#ffffff'}
                onChange={onChange}
              />
              <button
                className={`ee-color-save-preset ${styles.colorSavePresetBtn}`}
                onClick={handleSavePreset}
                title="Save current color as preset"
                disabled={!value || value === 'transparent' || customColorPresets.includes(value)}
              >
                + Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
