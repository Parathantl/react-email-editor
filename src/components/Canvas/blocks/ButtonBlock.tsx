import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface ButtonBlockProps {
  block: Block;
}

export const ButtonBlock = React.memo(function ButtonBlock({ block }: ButtonBlockProps) {
  const p = block.properties;
  const alignClass =
    p.align === 'left'
      ? styles.buttonBlockLeft
      : p.align === 'right'
        ? styles.buttonBlockRight
        : styles.buttonBlockCenter;

  return (
    <div className={`ee-block-button ${styles.buttonBlock} ${alignClass}`} style={{ padding: p.padding }}>
      <span
        className={styles.buttonPreview}
        style={{
          backgroundColor: p.backgroundColor,
          color: p.color,
          fontFamily: p.fontFamily,
          fontSize: p.fontSize,
          borderRadius: p.borderRadius,
          padding: p.innerPadding,
          width: p.width !== 'auto' ? p.width : undefined,
          fontWeight: p.fontWeight,
          textTransform: p.textTransform,
          letterSpacing: p.letterSpacing,
        }}
      >
        {p.text}
      </span>
    </div>
  );
});
