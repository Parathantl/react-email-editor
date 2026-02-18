import type { ImageUploadAdapter, UploadResult } from '../../src/types';

/**
 * Dev-only adapter that converts images to base64 data URLs.
 * Not suitable for production — generates large inline images.
 */
export function createBase64Adapter(): ImageUploadAdapter {
  return {
    upload: (file: File): Promise<UploadResult> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new Image();
          img.onload = () => {
            resolve({
              url: dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              alt: file.name.replace(/\.[^.]+$/, ''),
            });
          };
          img.onerror = () => {
            resolve({ url: dataUrl, alt: file.name });
          };
          img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },

    validate: (file: File): string | null => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return 'File size must be less than 5MB';
      }
      if (!file.type.startsWith('image/')) {
        return 'File must be an image';
      }
      return null;
    },
  };
}
