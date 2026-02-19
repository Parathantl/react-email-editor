import React, { useCallback, useRef } from 'react';
import type { Block } from '../../types';
import { useImageAdapter } from '../../context/EditorContext';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { useImageUpload } from '../ImageUpload/useImageUpload';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

interface ImagePropertiesProps {
  block: Block;
}

export function ImageProperties({ block }: ImagePropertiesProps) {
  const update = useBlockUpdate(block.id);
  const { imageUploadAdapter } = useImageAdapter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const p = block.properties;

  const { upload, status, error } = useImageUpload({
    adapter: imageUploadAdapter,
    blockId: block.id,
    onSuccess: (result) => {
      update({
        src: result.url,
        alt: result.alt ?? p.alt,
        width: result.width ? `${result.width}px` : p.width,
      });
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await upload(file);
    },
    [upload],
  );

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="text" label="Image URL" value={p.src} onChange={(v) => update({ src: v })} placeholder="https://..." />
      {imageUploadAdapter && (
        <div className={styles.fieldGroup}>
          <button
            className={`ee-upload-btn ${status === 'uploading' ? styles.fieldBtnUploadDisabled : styles.fieldBtnUpload}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'uploading'}
          >
            {status === 'uploading' ? 'Uploading...' : 'Upload Image'}
          </button>
          {error && <span className={`ee-upload-error ${styles.validationError}`}>{error}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}
      <PropertyField type="text" label="Alt Text" value={p.alt} onChange={(v) => update({ alt: v })} placeholder="Image description" />
      <PropertyField type="link" label="Link URL" value={p.href} onChange={(v) => update({ href: v })} />
      <FieldSeparator />
      <div className={styles.fieldRow}>
        <div className={styles.fieldHalf}>
          <PropertyField type="text" label="Width" value={p.width} onChange={(v) => update({ width: v })} />
        </div>
        <div className={styles.fieldHalf}>
          <PropertyField type="text" label="Height" value={p.height} onChange={(v) => update({ height: v })} />
        </div>
      </div>
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <PropertyField type="toggle" label="Fluid on Mobile" value={p.fluidOnMobile} onChange={(v) => update({ fluidOnMobile: v })} />
    </div>
  );
}
