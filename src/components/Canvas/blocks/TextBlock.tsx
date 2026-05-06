import React from 'react';
import type { Block } from '../../../types';
import { RichTextBlock } from './RichTextBlock';
import styles from '../../../styles/blocks.module.css';

interface TextBlockProps {
  block: Block;
}

const TextBlockInner = function TextBlock({ block }: TextBlockProps) {
  return (
    <RichTextBlock
      block={block}
      wrapperClassName={`ee-block-text ${styles['ee-text-block']}`}
      placeholder="Edit this text..."
      defaultFontFamily={block.properties.fontFamily}
      defaultFontSize={block.properties.fontSize}
    />
  );
};

export const TextBlock = React.memo(TextBlockInner);
