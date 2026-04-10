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
    <div className={`ee-field-group ee-slider ${styles['ee-field-group']}`}>
      <label className={styles['ee-field-label']}>{label}</label>
      <div className={styles['ee-slider-wrapper']}>
        <input
          type="range"
          className={styles['ee-slider-input']}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
        />
        <span className={styles['ee-slider-value']}>
          {value}{unit}
        </span>
      </div>
    </div>
  );
}
