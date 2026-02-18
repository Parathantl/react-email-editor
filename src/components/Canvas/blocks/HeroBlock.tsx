import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface HeroBlockProps {
  block: Block;
}

export const HeroBlock = React.memo(function HeroBlock({ block }: HeroBlockProps) {
  const p = block.properties;

  const containerStyle: React.CSSProperties = {
    padding: p.padding,
    textAlign: p.align,
    backgroundColor: p.backgroundColor || undefined,
    backgroundImage: p.backgroundImage ? `url(${p.backgroundImage})` : undefined,
    backgroundSize: p.backgroundImage ? 'cover' : undefined,
    backgroundPosition: p.backgroundImage ? 'center' : undefined,
    backgroundRepeat: p.backgroundImage ? 'no-repeat' : undefined,
  };

  return (
    <div className={styles.heroBlock} style={containerStyle}>
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
});
