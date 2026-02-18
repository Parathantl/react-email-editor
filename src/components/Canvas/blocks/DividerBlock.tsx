import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface DividerBlockProps {
  block: Block;
}

export const DividerBlock = React.memo(function DividerBlock({ block }: DividerBlockProps) {
  const p = block.properties;

  return (
    <div className={styles.dividerBlock} style={{ padding: p.padding }}>
      <hr
        className={styles.dividerLine}
        style={{
          width: p.width,
          borderTop: `${p.borderWidth} ${p.borderStyle} ${p.borderColor}`,
        }}
      />
    </div>
  );
});
