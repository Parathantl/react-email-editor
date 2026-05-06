import React from 'react';
import type { Block } from '../../../types';
import { RichTextBlock } from './RichTextBlock';
import styles from '../../../styles/blocks.module.css';

interface HeadingBlockProps {
  block: Block;
}

const HEADING_FONT_SIZES: Record<string, string> = {
  h1: '36px',
  h2: '28px',
  h3: '22px',
  h4: '18px',
};

const HeadingBlockInner = function HeadingBlock({ block }: HeadingBlockProps) {
  const p = block.properties;
  const fontSize = p.fontSize || HEADING_FONT_SIZES[p.level] || '28px';
  return (
    <RichTextBlock
      block={block}
      wrapperClassName={`ee-block-heading ${styles['ee-heading-block']}`}
      placeholder="Enter heading..."
      fontSize={fontSize}
    />
  );
};

export const HeadingBlock = React.memo(HeadingBlockInner);
