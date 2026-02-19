import React from 'react';
import type { Block } from '../../../types';
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

  return (
    <div className={`ee-block-menu ${styles.menuBlock}`} style={{ padding: p.padding, justifyContent: alignStyle }}>
      <div className={styles.menuItems} style={{ justifyContent: alignStyle }}>
        {p.items.map((item: any, idx: number) => (
          <span
            key={idx}
            className={styles.menuItem}
            style={{
              fontFamily: p.fontFamily,
              fontSize: p.fontSize,
              color: p.color,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
});
