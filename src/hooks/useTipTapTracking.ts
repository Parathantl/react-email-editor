import { useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/core';

interface UseTipTapTrackingResult {
  setActiveEditor: (editor: Editor | null) => void;
  getActiveEditor: () => Editor | null;
  insertVariable: (key: string) => boolean;
}

export function useTipTapTracking(): UseTipTapTrackingResult {
  const activeEditorRef = useRef<Editor | null>(null);

  const setActiveEditor = useCallback((editor: Editor | null) => {
    activeEditorRef.current = editor;
  }, []);

  const getActiveEditor = useCallback(() => {
    return activeEditorRef.current;
  }, []);

  const insertVariable = useCallback((key: string): boolean => {
    const editor = activeEditorRef.current;
    if (!editor || editor.isDestroyed) return false;
    editor.chain().focus().insertVariable(key).run();
    return true;
  }, []);

  return { setActiveEditor, getActiveEditor, insertVariable };
}
