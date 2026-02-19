import React, { useMemo } from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface DividerBlockProps {
  block: Block;
}

export const DividerBlock = React.memo(function DividerBlock({ block }: DividerBlockProps) {
  const p = block.properties;

  const outerStyle = useMemo(() => ({ padding: p.padding }), [p.padding]);
  const hrStyle = useMemo(() => ({
    width: p.width,
    borderTop: `${p.borderWidth} ${p.borderStyle} ${p.borderColor}`,
  }), [p.width, p.borderWidth, p.borderStyle, p.borderColor]);

  return (
    <div className={`ee-block-divider ${styles.dividerBlock}`} style={outerStyle}>
      <hr
        className={styles.dividerLine}
        style={hrStyle}
      />
    </div>
  );
});
