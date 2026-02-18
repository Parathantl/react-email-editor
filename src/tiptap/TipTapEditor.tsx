import React, { useCallback } from 'react';
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
  const editor = useTipTapEditor({
    extensions: getExtensions(placeholder),
    content,
    editable,
    editorProps: {
      transformPastedHTML(html) {
        return cleanPastedHTML(html);
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    onCreate: ({ editor: e }) => {
      editorRef?.(e);
    },
    onDestroy: () => {
      editorRef?.(null);
    },
  });

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
}

export { useTipTapEditor };
