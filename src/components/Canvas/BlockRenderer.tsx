import React from 'react';
import type { Block } from '../../types';
import { blockRendererRegistry, registerBlockRenderer } from '../../registry';
import { ErrorBoundary } from '../ErrorBoundary';
import { TextBlock } from './blocks/TextBlock';
import { ButtonBlock } from './blocks/ButtonBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { SpacerBlock } from './blocks/SpacerBlock';
import { SocialBlock } from './blocks/SocialBlock';
import { HtmlBlock } from './blocks/HtmlBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { CountdownBlock } from './blocks/CountdownBlock';
import { MenuBlock } from './blocks/MenuBlock';
import { HeroBlock } from './blocks/HeroBlock';

// Register built-in block renderers
registerBlockRenderer('text', TextBlock);
registerBlockRenderer('button', ButtonBlock);
registerBlockRenderer('image', ImageBlock);
registerBlockRenderer('divider', DividerBlock);
registerBlockRenderer('spacer', SpacerBlock);
registerBlockRenderer('social', SocialBlock);
registerBlockRenderer('html', HtmlBlock);
registerBlockRenderer('video', VideoBlock);
registerBlockRenderer('heading', HeadingBlock);
registerBlockRenderer('countdown', CountdownBlock);
registerBlockRenderer('menu', MenuBlock);
registerBlockRenderer('hero', HeroBlock);

interface BlockRendererProps {
  block: Block;
}

export const BlockRenderer = React.memo(function BlockRenderer({ block }: BlockRendererProps) {
  const Component = blockRendererRegistry[block.type];
  if (!Component) return null;
  return (
    <ErrorBoundary>
      <Component block={block} />
    </ErrorBoundary>
  );
});
