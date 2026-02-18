import type { ImageUploadAdapter, UploadOptions, UploadResult } from '../../src/types';

interface RestAdapterConfig {
  uploadUrl: string;
  headers?: Record<string, string>;
  fieldName?: string;
}

/**
 * Generic REST API adapter for image uploads.
 * Expects the server to return JSON with { url, width?, height?, alt? }.
 */
export function createRestAdapter(config: RestAdapterConfig): ImageUploadAdapter {
  const { uploadUrl, headers = {}, fieldName = 'file' } = config;

  return {
    upload: async (file: File, opts?: UploadOptions): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append(fieldName, file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: opts?.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        url: result.url,
        width: result.width,
        height: result.height,
        alt: result.alt,
      };
    },

    validate: (file: File): string | null => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return 'File size must be less than 10MB';
      }
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        return 'Unsupported image format';
      }
      return null;
    },
  };
}
