import React from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField } from './PropertyField';
import styles from '../../styles/properties.module.css';

const BORDER_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

interface DividerPropertiesProps {
  block: Block;
}

export function DividerProperties({ block }: DividerPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="color" label="Border Color" value={p.borderColor} onChange={(v) => update({ borderColor: v })} />
      <PropertyField type="text" label="Border Width" value={p.borderWidth} onChange={(v) => update({ borderWidth: v })} />
      <PropertyField type="select" label="Border Style" value={p.borderStyle} onChange={(v) => update({ borderStyle: v })} options={BORDER_STYLE_OPTIONS} />
      <PropertyField type="text" label="Width" value={p.width} onChange={(v) => update({ width: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
    </div>
  );
}
