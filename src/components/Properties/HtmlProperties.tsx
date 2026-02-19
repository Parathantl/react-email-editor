import React from 'react';
import type { Block } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { PropertyField } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface HtmlPropertiesProps {
  block: Block;
}

export function HtmlProperties({ block }: HtmlPropertiesProps) {
  const update = useBlockUpdate(block.id);
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="textarea" label="HTML Content" value={p.content} onChange={(v) => update({ content: v })} placeholder="<p>Enter raw HTML here...</p>" rows={10} code />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
    </div>
  );
}
