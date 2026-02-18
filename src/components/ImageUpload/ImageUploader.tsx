import React, { useCallback, useRef } from 'react';
import { useImageUpload } from './useImageUpload';
import { useImageAdapter } from '../../context/EditorContext';
import styles from '../../styles/blocks.module.css';

interface ImageUploaderProps {
  blockId: string;
  onUploadComplete: (url: string, alt?: string) => void;
}

export function ImageUploader({ blockId, onUploadComplete }: ImageUploaderProps) {
  const { imageUploadAdapter } = useImageAdapter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, progress, error, upload, cancel } = useImageUpload({
    adapter: imageUploadAdapter,
    blockId,
    onSuccess: (result) => {
      onUploadComplete(result.url, result.alt);
    },
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await upload(file);
      }
    },
    [upload],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div>
      {status === 'uploading' ? (
        <div className={styles.imageUploading}>
          <div className={styles.imagePlaceholder}>
            <span>Uploading... {Math.round(progress)}%</span>
            <button onClick={cancel} style={{ cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
          <div className={styles.imageProgress} style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className={styles.imagePlaceholder} onClick={handleClick}>
          <span className={styles.imagePlaceholderIcon}>+</span>
          <span>Click to upload image</span>
        </div>
      )}
      {error && <div className={styles.imageError}>{error}</div>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
