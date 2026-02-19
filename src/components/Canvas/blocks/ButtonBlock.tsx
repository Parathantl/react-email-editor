import React, { useMemo } from 'react';
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

  const outerStyle = useMemo(() => ({ padding: p.padding }), [p.padding]);
  const buttonStyle = useMemo(() => ({
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
  }), [p.backgroundColor, p.color, p.fontFamily, p.fontSize, p.borderRadius, p.innerPadding, p.width, p.fontWeight, p.textTransform, p.letterSpacing]);

  return (
    <div className={`ee-block-button ${styles.buttonBlock} ${alignClass}`} style={outerStyle}>
      <span
        className={styles.buttonPreview}
        style={buttonStyle}
      >
        {p.text}
      </span>
    </div>
  );
});
