import React from 'react';
import type { Block } from '../../types';
import { useSelectedBlock, useSelectedSection } from '../../context/EditorContext';
import { SectionProperties } from './SectionProperties';
import { HeadMetadataProperties } from './HeadMetadataProperties';
import { blockPropertiesRegistry, registerBlockProperties } from '../../registry';
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

// Register built-in property panels
registerBlockProperties('text', TextProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('button', ButtonProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('image', ImageProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('divider', DividerProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('spacer', SpacerProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('social', SocialProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('html', HtmlProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('video', VideoProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('heading', HeadingProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('countdown', CountdownProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('menu', MenuProperties as React.ComponentType<{ block: Block }>);
registerBlockProperties('hero', HeroProperties as React.ComponentType<{ block: Block }>);

export function PropertiesPanel() {
  const selectedBlock = useSelectedBlock();
  const selectedSection = useSelectedSection();

  if (selectedBlock) {
    const title = selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1);
    const Component = blockPropertiesRegistry[selectedBlock.type];
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
