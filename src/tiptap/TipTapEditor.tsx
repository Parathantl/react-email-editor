import React, { useMemo, useEffect, useRef } from 'react';
import { useEditor as useTipTapEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { getExtensions } from './extensions';
import { cleanPastedHTML } from './pasteClean';

export interface TipTapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  className?: string;
  editorRef?: (editor: Editor | null) => void;
  placeholder?: string;
}

export function TipTapEditor({
  content,
  onUpdate,
  onFocus,
  onBlur,
  editable = true,
  className,
  editorRef,
  placeholder,
}: TipTapEditorProps) {
  // Memoize extensions to prevent TipTap editor re-creation on every render
  const extensions = useMemo(() => getExtensions(placeholder), [placeholder]);

  // Use refs for callbacks to avoid stale closures in TipTap event handlers
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const editorRefCb = useRef(editorRef);
  editorRefCb.current = editorRef;

  const editor = useTipTapEditor({
    extensions,
    content,
    editable,
    editorProps: {
      transformPastedHTML(html) {
        return cleanPastedHTML(html);
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdateRef.current(e.getHTML());
    },
    onFocus: () => onFocusRef.current?.(),
    onBlur: () => onBlurRef.current?.(),
  });

  // Notify parent when the editor instance changes.
  // Using useEffect instead of onCreate/onDestroy avoids timing issues
  // with @tiptap/react's internal scheduleDestroy mechanism.
  useEffect(() => {
    editorRefCb.current?.(editor ?? null);
    return () => {
      editorRefCb.current?.(null);
    };
  }, [editor]);

  // Sync content from external changes (undo/redo, loadJSON, loadMJML)
  // Only update if the editor is not focused (user is not actively editing)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isFocused) return;
    const currentHTML = editor.getHTML();
    if (currentHTML !== content) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
}

export { useTipTapEditor };
