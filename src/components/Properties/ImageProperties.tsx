import React, { useCallback, useRef } from 'react';
import type { Block, ImageBlockProperties } from '../../types';
import { useEditorDispatch, useImageAdapter } from '../../context/EditorContext';
import { useImageUpload } from '../ImageUpload/useImageUpload';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import { LinkInput } from './controls/LinkInput';
import styles from '../../styles/properties.module.css';

interface ImagePropertiesProps {
  block: Block;
}

export function ImageProperties({ block }: ImagePropertiesProps) {
  const dispatch = useEditorDispatch();
  const { imageUploadAdapter } = useImageAdapter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const p = block.properties;

  const update = useCallback(
    (props: Partial<ImageBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

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
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Image URL</label>
        <input
          className={styles.fieldInput}
          value={p.src}
          onChange={(e) => update({ src: e.target.value })}
          placeholder="https://..."
        />
      </div>
      {imageUploadAdapter && (
        <div className={styles.fieldGroup}>
          <button
            className={styles.fieldInput}
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'uploading'}
            style={{ cursor: status === 'uploading' ? 'wait' : 'pointer', textAlign: 'center' }}
          >
            {status === 'uploading' ? 'Uploading...' : 'Upload Image'}
          </button>
          {error && <span style={{ color: '#ef4444', fontSize: '12px' }}>{error}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Alt Text</label>
        <input
          className={styles.fieldInput}
          value={p.alt}
          onChange={(e) => update({ alt: e.target.value })}
          placeholder="Image description"
        />
      </div>
      <LinkInput
        label="Link URL"
        value={p.href}
        onChange={(href) => update({ href })}
      />
      <div className={styles.separator} />
      <div className={styles.fieldRow}>
        <div className={styles.fieldHalf}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Width</label>
            <input
              className={styles.fieldInput}
              value={p.width}
              onChange={(e) => update({ width: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.fieldHalf}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Height</label>
            <input
              className={styles.fieldInput}
              value={p.height}
              onChange={(e) => update({ height: e.target.value })}
            />
          </div>
        </div>
      </div>
      <AlignmentPicker
        label="Alignment"
        value={p.align}
        onChange={(align) => update({ align })}
      />
      <PaddingInput
        label="Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <input
            type="checkbox"
            checked={p.fluidOnMobile}
            onChange={(e) => update({ fluidOnMobile: e.target.checked })}
          />{' '}
          Fluid on Mobile
        </label>
      </div>
    </div>
  );
}
