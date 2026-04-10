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
    <div className={`ee-field-group ee-color-picker ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-color-picker-wrapper']} ref={wrapperRef}>
        <div
          className={styles['ee-color-picker-trigger']}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div
            className={`${styles['ee-color-swatch']} ${value === 'transparent' ? styles['ee-color-swatch-transparent'] : ''}`}
            style={value !== 'transparent' ? { backgroundColor: value || 'transparent' } : undefined}
          />
          <span className={styles['ee-color-value']}>{value || 'transparent'}</span>
        </div>
        {isOpen && (
          <div className={styles['ee-color-presets']}>
            <button
              className={`ee-color-preset-transparent ${styles['ee-color-preset-btn']} ${styles['ee-color-preset-btn-transparent']} ${styles['ee-color-preset-btn-full']} ${
                value === 'transparent' ? styles['ee-color-preset-btn-active'] : ''
              }`}
              onClick={() => handlePresetClick('transparent')}
              title="transparent"
            >
              Transparent
            </button>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`${styles['ee-color-preset-btn']} ${
                  color === value ? styles['ee-color-preset-btn-active'] : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
                title={color}
              />
            ))}
            {customColorPresets.length > 0 && (
              <>
                <div className={`${styles['ee-color-preset-btn-full']} ${styles['ee-color-preset-section-label']}`}>Custom</div>
                {customColorPresets.map((color) => (
                  <button
                    key={`custom-${color}`}
                    className={`${styles['ee-color-preset-btn']} ${
                      color === value ? styles['ee-color-preset-btn-active'] : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetClick(color)}
                    onContextMenu={(e) => handlePresetContextMenu(e, color)}
                    title={`${color} (right-click to remove)`}
                  />
                ))}
              </>
            )}
            <div className={`${styles['ee-color-preset-btn-full']}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
              <HslColorArea
                value={isHex ? value : '#ffffff'}
                onChange={onChange}
              />
              <button
                className={`ee-color-save-preset ${styles['ee-color-save-preset-btn']}`}
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
