import React from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

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

interface ButtonPropertiesProps {
  block: Block;
}

export function ButtonProperties({ block }: ButtonPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="text" label="Button Text" value={p.text} onChange={(v) => update({ text: v })} />
      <PropertyField type="link" label="Link URL" value={p.href} onChange={(v) => update({ href: v })} />
      <FieldSeparator />
      <PropertyField type="color" label="Background Color" value={p.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
      <PropertyField type="color" label="Text Color" value={p.color} onChange={(v) => update({ color: v })} />
      <PropertyField type="font" label="Font Family" value={p.fontFamily} onChange={(v) => update({ fontFamily: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="text" label="Border Radius" value={p.borderRadius} onChange={(v) => update({ borderRadius: v })} />
      <PropertyField type="text" label="Width" value={p.width} onChange={(v) => update({ width: v })} placeholder="auto" />
      <PropertyField type="select" label="Font Weight" value={p.fontWeight || 'normal'} onChange={(v) => update({ fontWeight: v })} options={FONT_WEIGHT_OPTIONS} />
      <PropertyField type="select" label="Text Transform" value={p.textTransform || 'none'} onChange={(v) => update({ textTransform: v })} options={TEXT_TRANSFORM_OPTIONS} />
      <PropertyField type="text" label="Letter Spacing" value={p.letterSpacing || 'normal'} onChange={(v) => update({ letterSpacing: v })} placeholder="normal" />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Outer Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <PropertyField type="padding" label="Inner Padding" value={p.innerPadding} onChange={(v) => update({ innerPadding: v })} />
    </div>
  );
}
