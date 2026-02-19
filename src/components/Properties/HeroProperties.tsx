import React from 'react';
import type { Block } from '../../types';
import { narrowBlock } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { ImageUploader } from '../ImageUpload/ImageUploader';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface HeroPropertiesProps {
  block: Block;
}

export function HeroProperties({ block }: HeroPropertiesProps) {
  const update = useBlockUpdate(block.id);

  if (!narrowBlock(block, 'hero')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="text" label="Heading" value={p.heading} onChange={(v) => update({ heading: v })} />
      <PropertyField type="textarea" label="Subtext" value={p.subtext} onChange={(v) => update({ subtext: v })} rows={3} />
      <FieldSeparator />
      <PropertyField type="text" label="Button Text" value={p.buttonText} onChange={(v) => update({ buttonText: v })} />
      <PropertyField type="link" label="Button Link" value={p.buttonHref} onChange={(v) => update({ buttonHref: v })} />
      <FieldSeparator />
      <PropertyField type="color" label="Heading Color" value={p.headingColor} onChange={(v) => update({ headingColor: v })} />
      <PropertyField type="text" label="Heading Font Size" value={p.headingFontSize} onChange={(v) => update({ headingFontSize: v })} />
      <PropertyField type="color" label="Subtext Color" value={p.subtextColor} onChange={(v) => update({ subtextColor: v })} />
      <PropertyField type="text" label="Subtext Font Size" value={p.subtextFontSize} onChange={(v) => update({ subtextFontSize: v })} />
      <FieldSeparator />
      <PropertyField type="color" label="Button Background" value={p.buttonBackgroundColor} onChange={(v) => update({ buttonBackgroundColor: v })} />
      <PropertyField type="color" label="Button Text Color" value={p.buttonColor} onChange={(v) => update({ buttonColor: v })} />
      <PropertyField type="text" label="Button Border Radius" value={p.buttonBorderRadius} onChange={(v) => update({ buttonBorderRadius: v })} />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <FieldSeparator />
      <PropertyField type="color" label="Background Color" value={p.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
      <PropertyField type="text" label="Background Image URL" value={p.backgroundImage} onChange={(v) => update({ backgroundImage: v })} placeholder="https://example.com/image.jpg" />
      {!p.backgroundImage && (
        <ImageUploader
          blockId={block.id}
          onUploadComplete={(url) => update({ backgroundImage: url })}
        />
      )}
      {p.backgroundImage && (
        <div className={styles.fieldGroup}>
          <button
            className={`ee-remove-bg ${styles.fieldBtnUpload}`}
            onClick={() => update({ backgroundImage: '' })}
          >
            Remove Background Image
          </button>
        </div>
      )}
    </div>
  );
}
