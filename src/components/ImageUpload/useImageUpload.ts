import { useState, useCallback, useRef } from 'react';
import type { ImageUploadAdapter, UploadResult } from '../../types';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UseImageUploadOptions {
  adapter?: ImageUploadAdapter;
  blockId: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

interface UseImageUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  upload: (file: File) => Promise<UploadResult | null>;
  cancel: () => void;
  browse: () => Promise<UploadResult | null>;
  reset: () => void;
}

export function useImageUpload({
  adapter,
  blockId,
  onSuccess,
  onError,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      if (!adapter) {
        setError('No upload adapter configured');
        setStatus('error');
        return null;
      }

      // Validate file
      if (adapter.validate) {
        const validationError = adapter.validate(file);
        if (validationError) {
          setError(validationError);
          setStatus('error');
          onError?.(validationError);
          return null;
        }
      }

      // Start upload
      controllerRef.current = new AbortController();
      setStatus('uploading');
      setProgress(0);
      setError(null);

      try {
        const result = await adapter.upload(file, {
          context: 'block',
          blockId,
          signal: controllerRef.current.signal,
        });

        setStatus('success');
        setProgress(100);
        onSuccess?.(result);
        return result;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setStatus('idle');
          setProgress(0);
          return null;
        }
        const errorMessage = (err as Error).message || 'Upload failed';
        setError(errorMessage);
        setStatus('error');
        onError?.(errorMessage);
        return null;
      }
    },
    [adapter, blockId, onSuccess, onError],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setStatus('idle');
    setProgress(0);
  }, []);

  const browse = useCallback(async (): Promise<UploadResult | null> => {
    if (!adapter?.browse) return null;
    try {
      const result = await adapter.browse();
      if (result) {
        onSuccess?.(result);
      }
      return result;
    } catch {
      return null;
    }
  }, [adapter, onSuccess]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, error, upload, cancel, browse, reset };
}
