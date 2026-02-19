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
        <div className={`ee-image-uploading ${styles.imageUploading}`}>
          <div className={`ee-image-placeholder ${styles.imagePlaceholder}`}>
            <span>Uploading... {Math.round(progress)}%</span>
            <button className="ee-upload-cancel" onClick={cancel}>
              Cancel
            </button>
          </div>
          <div className={`ee-image-progress ${styles.imageProgress}`} style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className={`ee-image-placeholder ${styles.imagePlaceholder}`} onClick={handleClick}>
          <span className={`ee-image-placeholder-icon ${styles.imagePlaceholderIcon}`}>+</span>
          <span>Click to upload image</span>
        </div>
      )}
      {error && <div className={`ee-image-error ${styles.imageError}`}>{error}</div>}
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
