import React from 'react';
import type { Block } from '../../types';
import { narrowBlock } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface CountdownPropertiesProps {
  block: Block;
}

export function CountdownProperties({ block }: CountdownPropertiesProps) {
  const update = useBlockUpdate(block.id);

  if (!narrowBlock(block, 'countdown')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Target Date</label>
        <input
          className={styles.fieldInput}
          type="datetime-local"
          value={p.targetDate}
          onChange={(e) => update({ targetDate: e.target.value })}
        />
      </div>
      <PropertyField type="text" label="Label" value={p.label} onChange={(v) => update({ label: v })} />
      <FieldSeparator />
      <PropertyField type="color" label="Digit Background" value={p.digitBackgroundColor} onChange={(v) => update({ digitBackgroundColor: v })} />
      <PropertyField type="color" label="Digit Color" value={p.digitColor} onChange={(v) => update({ digitColor: v })} />
      <PropertyField type="color" label="Label Color" value={p.labelColor} onChange={(v) => update({ labelColor: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
    </div>
  );
}
