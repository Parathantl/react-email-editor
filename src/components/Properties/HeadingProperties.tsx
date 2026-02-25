import React, { useCallback } from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

const LEVEL_OPTIONS = [
  { value: 'h1', label: 'H1' }, { value: 'h2', label: 'H2' },
  { value: 'h3', label: 'H3' }, { value: 'h4', label: 'H4' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' },
  { value: '100', label: '100' }, { value: '200', label: '200' },
  { value: '300', label: '300' }, { value: '400', label: '400' },
  { value: '500', label: '500' }, { value: '600', label: '600' },
  { value: '700', label: '700' }, { value: '800', label: '800' },
  { value: '900', label: '900' },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' }, { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' }, { value: 'capitalize', label: 'Capitalize' },
];

const LEVEL_DEFAULTS: Record<string, { fontSize: string; lineHeight: string }> = {
  h1: { fontSize: '36px', lineHeight: '1.2' },
  h2: { fontSize: '28px', lineHeight: '1.3' },
  h3: { fontSize: '22px', lineHeight: '1.3' },
  h4: { fontSize: '18px', lineHeight: '1.4' },
};

interface HeadingPropertiesProps {
  block: Block;
}

export function HeadingProperties({ block }: HeadingPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;

  const handleLevelChange = useCallback(
    (level: string) => {
      const defaults = LEVEL_DEFAULTS[level] || LEVEL_DEFAULTS.h2;
      update({ level: level, fontSize: defaults.fontSize, lineHeight: defaults.lineHeight });
    },
    [update],
  );

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="select" label="Heading Level" value={p.level} onChange={handleLevelChange} options={LEVEL_OPTIONS} />
      <FieldSeparator />
      <PropertyField type="font" label="Font Family" value={p.fontFamily} onChange={(v) => update({ fontFamily: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="color" label="Color" value={p.color} onChange={(v) => update({ color: v })} />
      <PropertyField type="color" label="Background Color" value={p.backgroundColor || 'transparent'} onChange={(v) => update({ backgroundColor: v })} />
      <PropertyField type="text" label="Line Height" value={p.lineHeight} onChange={(v) => update({ lineHeight: v })} />
      <PropertyField type="select" label="Font Weight" value={p.fontWeight || 'bold'} onChange={(v) => update({ fontWeight: v })} options={FONT_WEIGHT_OPTIONS} />
      <PropertyField type="select" label="Text Transform" value={p.textTransform || 'none'} onChange={(v) => update({ textTransform: v })} options={TEXT_TRANSFORM_OPTIONS} />
      <PropertyField type="text" label="Letter Spacing" value={p.letterSpacing || 'normal'} onChange={(v) => update({ letterSpacing: v })} placeholder="normal" />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
    </div>
  );
}
