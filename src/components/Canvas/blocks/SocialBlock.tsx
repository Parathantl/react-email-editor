import React, { useMemo } from 'react';
import type { Block, SocialElement } from '../../../types';
import styles from '../../../styles/blocks.module.css';
import { getSocialIcon } from './social-icons';

interface SocialBlockProps {
  block: Block;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#3b5998',
  twitter: '#1da1f2',
  instagram: '#e1306c',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  github: '#333333',
  pinterest: '#bd081c',
  snapchat: '#fffc00',
  tiktok: '#000000',
  web: '#4caf50',
};

export const SocialBlock = React.memo(function SocialBlock({ block }: SocialBlockProps) {
  const p = block.properties;
  const isVertical = p.mode === 'vertical';

  const alignStyle =
    p.align === 'left'
      ? 'flex-start'
      : p.align === 'right'
        ? 'flex-end'
        : 'center';

  const iconSizeNum = parseInt(p.iconSize, 10) || 20;

  const wrapperStyle = useMemo(() => ({
    padding: p.padding,
    justifyContent: alignStyle,
    flexDirection: (isVertical ? 'column' : 'row') as React.CSSProperties['flexDirection'],
    alignItems: isVertical ? alignStyle : 'center',
  }), [p.padding, alignStyle, isVertical]);

  const elementPaddingStyle = useMemo(() => ({
    padding: p.iconPadding,
  }), [p.iconPadding]);

  const labelStyle = useMemo(() => ({
    fontSize: p.fontSize, color: p.color,
  }), [p.fontSize, p.color]);

  return (
    <div
      className={`ee-block-social ${styles.socialBlock}`}
      style={wrapperStyle}
    >
      {p.elements.map((element: SocialElement) => {
        const bgColor = element.backgroundColor || PLATFORM_COLORS[element.name] || '#999999';
        const iconColor = element.color || '#ffffff';
        const SvgIcon = getSocialIcon(element.name);

        let iconContent: React.ReactNode;
        if (element.src) {
          iconContent = (
            <img
              src={element.src}
              alt={element.name}
              className={styles.socialIconImage}
              width={iconSizeNum}
              height={iconSizeNum}
            />
          );
        } else if (SvgIcon) {
          iconContent = <SvgIcon size={Math.round(iconSizeNum * 0.6)} color={iconColor} />;
        } else {
          iconContent = element.name.charAt(0).toUpperCase();
        }

        return (
          <div
            key={`${element.name}-${element.href}`}
            className={styles.socialElement}
            style={elementPaddingStyle}
          >
            <span
              className={styles.socialIcon}
              style={{
                width: iconSizeNum,
                height: iconSizeNum,
                backgroundColor: bgColor,
                borderRadius: p.borderRadius,
                color: iconColor,
                fontSize: Math.max(10, iconSizeNum * 0.5),
              }}
            >
              {iconContent}
            </span>
            {element.content && (
              <span
                className={styles.socialLabel}
                style={labelStyle}
              >
                {element.content}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});
