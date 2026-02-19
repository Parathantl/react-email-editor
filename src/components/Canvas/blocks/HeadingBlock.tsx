import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { Block } from '../../../types';
import { useEditorDispatch, useConfigContext } from '../../../context/EditorContext';
import { TipTapEditor } from '../../../tiptap/TipTapEditor';
import { RichTextToolbar } from '../../Toolbar/RichTextToolbar';
import type { Editor } from '@tiptap/core';
import styles from '../../../styles/blocks.module.css';
import tiptapStyles from '../../../styles/tiptap.module.css';

interface HeadingBlockProps {
  block: Block;
}

const HEADING_FONT_SIZES: Record<string, string> = {
  h1: '36px',
  h2: '28px',
  h3: '22px',
  h4: '18px',
};

export function HeadingBlock({ block }: HeadingBlockProps) {
  const dispatch = useEditorDispatch();
  const { setActiveEditor } = useConfigContext();
  const editorRef = useRef<Editor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [, setTick] = useState(0);

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
    setTick((n) => n + 1);
  }, []);

  const p = block.properties;
  const fontSize = p.fontSize || HEADING_FONT_SIZES[p.level] || '28px';

  return (
    <div className={`ee-block-heading ${styles.headingBlock}`} ref={wrapperRef}>
      {isFocused && (
        <div className={styles.textBlockToolbar}>
          <RichTextToolbar editor={editorRef.current} />
        </div>
      )}
      <div
        style={{
          fontFamily: p.fontFamily,
          fontSize,
          color: p.color,
          lineHeight: p.lineHeight,
          padding: p.padding,
          fontWeight: p.fontWeight,
          textTransform: p.textTransform,
          letterSpacing: p.letterSpacing,
        }}
      >
        <TipTapEditor
          content={p.content}
          onUpdate={handleUpdate}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={tiptapStyles.tiptapWrapper}
          editorRef={handleEditorRef}
          placeholder="Enter heading..."
        />
      </div>
    </div>
  );
}
