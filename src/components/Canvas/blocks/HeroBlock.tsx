import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface HeroBlockProps {
  block: Block;
}

export function HeroBlock({ block }: HeroBlockProps) {
  const p = block.properties;

  return (
    <div className={styles.heroBlock} style={{ padding: p.padding, textAlign: p.align }}>
      {p.heading && (
        <h2
          className={styles.heroHeading}
          style={{
            color: p.headingColor,
            fontSize: p.headingFontSize,
          }}
        >
          {p.heading}
        </h2>
      )}
      {p.subtext && (
        <p
          className={styles.heroSubtext}
          style={{
            color: p.subtextColor,
            fontSize: p.subtextFontSize,
          }}
        >
          {p.subtext}
        </p>
      )}
      {p.buttonText && (
        <span
          className={styles.heroButton}
          style={{
            backgroundColor: p.buttonBackgroundColor,
            color: p.buttonColor,
            borderRadius: p.buttonBorderRadius,
          }}
        >
          {p.buttonText}
        </span>
      )}
    </div>
  );
}
