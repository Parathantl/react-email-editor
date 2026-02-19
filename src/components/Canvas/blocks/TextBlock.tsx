import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { Block } from '../../../types';
import { useEditorDispatch, useConfigContext } from '../../../context/EditorContext';
import { TipTapEditor } from '../../../tiptap/TipTapEditor';
import { RichTextToolbar } from '../../Toolbar/RichTextToolbar';
import type { Editor } from '@tiptap/core';
import styles from '../../../styles/blocks.module.css';
import tiptapStyles from '../../../styles/tiptap.module.css';

interface TextBlockProps {
  block: Block;
}

export function TextBlock({ block }: TextBlockProps) {
  const dispatch = useEditorDispatch();
  const { setActiveEditor } = useConfigContext();
  const editorRef = useRef<Editor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [, setTick] = useState(0);

  // Attach/detach editor event listeners with proper cleanup
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onUpdate = () => setTick((n) => n + 1);
    editor.on('selectionUpdate', onUpdate);
    editor.on('transaction', onUpdate);

    return () => {
      editor.off('selectionUpdate', onUpdate);
      editor.off('transaction', onUpdate);
    };
  }, [editorRef.current]);

  const handleUpdate = useCallback(
    (html: string) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: { content: html } },
      });
    },
    [dispatch, block.id],
  );

  const handleFocus = useCallback(() => {
    setActiveEditor(editorRef.current);
    setIsFocused(true);
  }, [setActiveEditor]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (wrapperRef.current && wrapperRef.current.contains(activeEl)) {
        return;
      }
      if (editorRef.current && !editorRef.current.isFocused) {
        setActiveEditor(null);
        setIsFocused(false);
      }
    }, 200);
  }, [setActiveEditor]);

  const handleEditorRef = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
    // Trigger re-render so useEffect picks up the new editor
    setTick((n) => n + 1);
  }, []);

  return (
    <div className={`ee-block-text ${styles.textBlock}`} ref={wrapperRef}>
      {isFocused && (
        <div className={styles.textBlockToolbar}>
          <RichTextToolbar editor={editorRef.current} />
        </div>
      )}
      <div
        style={{
          fontFamily: block.properties.fontFamily,
          fontSize: block.properties.fontSize,
          color: block.properties.color,
          lineHeight: block.properties.lineHeight,
          padding: block.properties.padding,
          fontWeight: block.properties.fontWeight,
          textTransform: block.properties.textTransform,
          letterSpacing: block.properties.letterSpacing,
        }}
      >
        <TipTapEditor
          content={block.properties.content}
          onUpdate={handleUpdate}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={tiptapStyles.tiptapWrapper}
          editorRef={handleEditorRef}
          placeholder="Edit this text..."
        />
      </div>
    </div>
  );
}
