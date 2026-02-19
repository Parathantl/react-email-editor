import React from 'react';
import type { Block, BlockType } from '../../types';
import { useSelectedBlock, useSelectedSection } from '../../context/EditorContext';
import { blockPropertiesRegistry } from '../../registry';
import { SectionProperties } from './SectionProperties';
import { HeadMetadataProperties } from './HeadMetadataProperties';
import { TextProperties } from './TextProperties';
import { ButtonProperties } from './ButtonProperties';
import { ImageProperties } from './ImageProperties';
import { DividerProperties } from './DividerProperties';
import { SpacerProperties } from './SpacerProperties';
import { SocialProperties } from './SocialProperties';
import { HtmlProperties } from './HtmlProperties';
import { VideoProperties } from './VideoProperties';
import { HeadingProperties } from './HeadingProperties';
import { CountdownProperties } from './CountdownProperties';
import { MenuProperties } from './MenuProperties';
import { HeroProperties } from './HeroProperties';
import styles from '../../styles/properties.module.css';

type BlockPanelComponent = React.ComponentType<{ block: Block }>;

/** Static lookup for built-in block property panels — no module-level side effects */
const BUILT_IN_PANELS: Record<string, BlockPanelComponent> = {
  text: TextProperties as BlockPanelComponent,
  button: ButtonProperties as BlockPanelComponent,
  image: ImageProperties as BlockPanelComponent,
  divider: DividerProperties as BlockPanelComponent,
  spacer: SpacerProperties as BlockPanelComponent,
  social: SocialProperties as BlockPanelComponent,
  html: HtmlProperties as BlockPanelComponent,
  video: VideoProperties as BlockPanelComponent,
  heading: HeadingProperties as BlockPanelComponent,
  countdown: CountdownProperties as BlockPanelComponent,
  menu: MenuProperties as BlockPanelComponent,
  hero: HeroProperties as BlockPanelComponent,
};

function getBlockPanel(type: string): BlockPanelComponent | undefined {
  // Custom-registered panels take precedence over built-in ones
  return blockPropertiesRegistry[type] ?? BUILT_IN_PANELS[type];
}

export function PropertiesPanel() {
  const selectedBlock = useSelectedBlock();
  const selectedSection = useSelectedSection();

  if (selectedBlock) {
    const title = selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1);
    const Component = getBlockPanel(selectedBlock.type);
    return (
      <div className={`ee-properties-panel ${styles.propertiesPanel}`}>
        <div className={`ee-properties-header ${styles.propertiesHeader}`}>{title} Properties</div>
        {Component ? <Component block={selectedBlock} /> : null}
      </div>
    );
  }

  if (selectedSection) {
    return (
      <div className={`ee-properties-panel ${styles.propertiesPanel}`}>
        <div className={`ee-properties-header ${styles.propertiesHeader}`}>Section Properties</div>
        <SectionProperties section={selectedSection} />
      </div>
    );
  }

  return (
    <div className={`ee-properties-panel ${styles.propertiesPanel}`}>
      <div className={`ee-properties-header ${styles.propertiesHeader}`}>Email Settings</div>
      <HeadMetadataProperties />
    </div>
  );
}
