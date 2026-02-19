import React, { useCallback } from 'react';
import styles from '../../../styles/properties.module.css';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: SliderInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className={`ee-field-group ee-slider ${styles.fieldGroup}`}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          className={styles.sliderInput}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
        />
        <span className={styles.sliderValue}>
          {value}{unit}
        </span>
      </div>
    </div>
  );
}
