import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface SpacerBlockProps {
  block: Block;
}

export const SpacerBlock = React.memo(function SpacerBlock({ block }: SpacerBlockProps) {
  const p = block.properties;

  return (
    <div className={styles.spacerBlock} style={{ height: p.height }}>
      <span className={styles.spacerLabel}>{p.height}</span>
    </div>
  );
});
