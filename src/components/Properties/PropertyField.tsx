import React from 'react';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import { FontPicker } from './controls/FontPicker';
import { SliderInput } from './controls/SliderInput';
import { LinkInput } from './controls/LinkInput';
import styles from '../../styles/properties.module.css';

interface SelectOption {
  value: string;
  label: string;
}

type PropertyFieldProps =
  | { type: 'color'; label: string; value: string; onChange: (v: string) => void }
  | { type: 'text'; label: string; value: string; onChange: (v: string) => void; placeholder?: string }
  | { type: 'textarea'; label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; code?: boolean }
  | { type: 'select'; label: string; value: string; onChange: (v: string) => void; options: SelectOption[] }
  | { type: 'padding'; label: string; value: string; onChange: (v: string) => void }
  | { type: 'alignment'; label: string; value: string; onChange: (v: string) => void; options?: string[] }
  | { type: 'slider'; label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }
  | { type: 'toggle'; label: string; value: boolean; onChange: (v: boolean) => void }
  | { type: 'font'; label: string; value: string; onChange: (v: string) => void }
  | { type: 'link'; label: string; value: string; onChange: (v: string) => void };

/**
 * Declarative property field that renders the appropriate control.
 * Reduces per-panel boilerplate from repeated JSX to a single component.
 * Wrapped in React.memo to prevent cascading re-renders when sibling fields change.
 */
export const PropertyField = React.memo(function PropertyField(props: PropertyFieldProps) {
  switch (props.type) {
    case 'color':
      return <ColorPicker label={props.label} value={props.value} onChange={props.onChange} />;

    case 'padding':
      return <PaddingInput label={props.label} value={props.value} onChange={props.onChange} />;

    case 'alignment':
      return <AlignmentPicker label={props.label} value={props.value} onChange={props.onChange} options={props.options} />;

    case 'font':
      return <FontPicker label={props.label} value={props.value} onChange={props.onChange} />;

    case 'link':
      return <LinkInput label={props.label} value={props.value} onChange={props.onChange} />;

    case 'slider':
      return (
        <SliderInput
          label={props.label}
          value={props.value}
          min={props.min}
          max={props.max}
          step={props.step}
          unit={props.unit}
          onChange={props.onChange}
        />
      );

    case 'toggle':
      return (
        <div className={styles.fieldGroup}>
          <label className={`ee-checkbox-label ${styles.checkboxLabel}`}>
            <input
              type="checkbox"
              checked={props.value}
              onChange={(e) => props.onChange(e.target.checked)}
            />
            {props.label}
          </label>
        </div>
      );

    case 'select':
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{props.label}</label>
          <select
            className={styles.fieldSelect}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
          >
            {props.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{props.label}</label>
          <textarea
            className={props.code ? `ee-code-textarea ${styles.fieldTextareaCode}` : styles.fieldTextarea}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows ?? 3}
          />
        </div>
      );

    case 'text':
    default:
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{props.label}</label>
          <input
            className={styles.fieldInput}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
          />
        </div>
      );
  }
});

/** Visual separator between field groups */
export function FieldSeparator() {
  return <div className={styles.separator} />;
}
