import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface SpacerBlockProps {
  block: Block;
}

export const SpacerBlock = React.memo(function SpacerBlock({ block }: SpacerBlockProps) {
  const p = block.properties;

  return (
    <div className={`ee-block-spacer ${styles['ee-spacer-block']}`} style={{ height: p.height }}>
      <span className={styles['ee-spacer-label']}>{p.height}</span>
    </div>
  );
});
