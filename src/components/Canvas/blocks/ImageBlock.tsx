import React, { useCallback, useRef } from 'react';
import type { Block } from '../../../types';
import { useEditorDispatch, useConfigContext } from '../../../context/EditorContext';
import { useImageUpload } from '../../ImageUpload/useImageUpload';
import styles from '../../../styles/blocks.module.css';

interface ImageBlockProps {
  block: Block;
}

const ImageBlockInner = function ImageBlock({ block }: ImageBlockProps) {
  const dispatch = useEditorDispatch();
  const { imageUploadAdapter } = useConfigContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const p = block.properties;

  const { upload, status } = useImageUpload({
    adapter: imageUploadAdapter,
    blockId: block.id,
    onSuccess: (result) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: {
          blockId: block.id,
          properties: {
            src: result.url,
            alt: result.alt ?? p.alt,
            width: result.width ? `${result.width}px` : p.width,
          },
        },
      });
    },
  });

  const alignClass =
    p.align === 'left'
      ? styles['ee-image-block-left']
      : p.align === 'right'
        ? styles['ee-image-block-right']
        : styles['ee-image-block-center'];

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await upload(file);
    },
    [upload],
  );

  const handlePlaceholderClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`ee-block-image ${styles['ee-image-block']} ${alignClass}`} style={{ padding: p.padding }}>
      {p.src ? (
        <img
          src={p.src}
          alt={p.alt}
          className={styles['ee-image-preview']}
          style={{
            width: p.width,
            height: p.height !== 'auto' ? p.height : undefined,
          }}
        />
      ) : (
        <div className={styles['ee-image-placeholder']} onClick={handlePlaceholderClick}>
          <span className={styles['ee-image-placeholder-icon']}>+</span>
          <span>{status === 'uploading' ? 'Uploading...' : 'Click to upload image'}</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export const ImageBlock = React.memo(ImageBlockInner);
