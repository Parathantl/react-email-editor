import React from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface SpacerPropertiesProps {
  block: Block;
}

export function SpacerProperties({ block }: SpacerPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;
  const heightNum = parseInt(p.height, 10) || 20;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="slider" label="Height" value={heightNum} min={5} max={200} step={5} unit="px" onChange={(v) => update({ height: `${v}px` })} />
    </div>
  );
}
