import React, { useMemo, type ReactNode } from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface ButtonBlockProps {
  block: Block;
}

const VARIABLE_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;

/**
 * Split plain `{{ key }}` markers in the button text into styled chip spans
 * so variables look the same as TipTap chips in text blocks. Storage stays
 * a plain string — chip rendering is a presentation-only concern here.
 */
function renderButtonText(text: string): ReactNode {
  if (!text) return text;
  if (!text.includes('{{')) return text;
  VARIABLE_REGEX.lastIndex = 0;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const key = match[1].trim();
    parts.push(
      <span key={`v-${start}`} className="ee-variable-chip" contentEditable={false}>
        {`{{ ${key} }}`}
      </span>,
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export const ButtonBlock = React.memo(function ButtonBlock({ block }: ButtonBlockProps) {
  const p = block.properties;
  const alignClass =
    p.align === 'left'
      ? styles['ee-button-block-left']
      : p.align === 'right'
        ? styles['ee-button-block-right']
        : styles['ee-button-block-center'];

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

  const content = useMemo(() => renderButtonText(p.text ?? ''), [p.text]);

  return (
    <div className={`ee-block-button ${styles['ee-button-block']} ${alignClass}`} style={outerStyle}>
      <span
        className={styles['ee-button-preview']}
        style={buttonStyle}
      >
        {content}
      </span>
    </div>
  );
});
