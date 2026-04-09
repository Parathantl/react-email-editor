import React, { useMemo } from 'react';
import type { Block, MenuItem } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface MenuBlockProps {
  block: Block;
}

export const MenuBlock = React.memo(function MenuBlock({ block }: MenuBlockProps) {
  const p = block.properties;

  const alignStyle =
    p.align === 'left'
      ? 'flex-start'
      : p.align === 'right'
        ? 'flex-end'
        : 'center';

  const wrapperStyle = useMemo(() => ({
    padding: p.padding, justifyContent: alignStyle,
  }), [p.padding, alignStyle]);

  const itemsStyle = useMemo(() => ({
    justifyContent: alignStyle,
  }), [alignStyle]);

  const itemStyle = useMemo(() => ({
    fontFamily: p.fontFamily,
    fontSize: p.fontSize,
    color: p.color,
  }), [p.fontFamily, p.fontSize, p.color]);

  return (
    <div className={`ee-block-menu ${styles['ee-menu-block']}`} style={wrapperStyle}>
      <div className={styles['ee-menu-items']} style={itemsStyle}>
        {p.items.map((item: MenuItem) => (
          <span
            key={`${item.text}-${item.href}`}
            className={styles['ee-menu-item']}
            style={itemStyle}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
});
