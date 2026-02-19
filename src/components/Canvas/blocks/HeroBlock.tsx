import React, { useMemo } from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface HeroBlockProps {
  block: Block;
}

export const HeroBlock = React.memo(function HeroBlock({ block }: HeroBlockProps) {
  const p = block.properties;

  const containerStyle = useMemo<React.CSSProperties>(() => ({
    padding: p.padding,
    textAlign: p.align,
    backgroundColor: p.backgroundColor || undefined,
    backgroundImage: p.backgroundImage ? `url(${p.backgroundImage})` : undefined,
    backgroundSize: p.backgroundImage ? 'cover' : undefined,
    backgroundPosition: p.backgroundImage ? 'center' : undefined,
    backgroundRepeat: p.backgroundImage ? 'no-repeat' : undefined,
  }), [p.padding, p.align, p.backgroundColor, p.backgroundImage]);

  const headingStyle = useMemo(() => ({
    color: p.headingColor,
    fontSize: p.headingFontSize,
  }), [p.headingColor, p.headingFontSize]);

  const subtextStyle = useMemo(() => ({
    color: p.subtextColor,
    fontSize: p.subtextFontSize,
  }), [p.subtextColor, p.subtextFontSize]);

  const buttonStyle = useMemo(() => ({
    backgroundColor: p.buttonBackgroundColor,
    color: p.buttonColor,
    borderRadius: p.buttonBorderRadius,
  }), [p.buttonBackgroundColor, p.buttonColor, p.buttonBorderRadius]);

  return (
    <div className={`ee-block-hero ${styles.heroBlock}`} style={containerStyle}>
      {p.heading && (
        <h2
          className={styles.heroHeading}
          style={headingStyle}
        >
          {p.heading}
        </h2>
      )}
      {p.subtext && (
        <p
          className={styles.heroSubtext}
          style={subtextStyle}
        >
          {p.subtext}
        </p>
      )}
      {p.buttonText && (
        <span
          className={styles.heroButton}
          style={buttonStyle}
        >
          {p.buttonText}
        </span>
      )}
    </div>
  );
});
