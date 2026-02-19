import React from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface TextPropertiesProps {
  block: Block;
}

export function TextProperties({ block }: TextPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <p className={styles.fieldHint}>
        Use the inline toolbar above the text block to format font, size, color, and alignment.
      </p>
      <PropertyField type="text" label="Line Height" value={p.lineHeight} onChange={(v) => update({ lineHeight: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
    </div>
  );
}
