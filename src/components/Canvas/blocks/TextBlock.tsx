import React, { useCallback, useRef, useState, useEffect, useReducer, useMemo } from 'react';
import type { Block } from '../../../types';
import { useEditorDispatch, useMethodsContext } from '../../../context/EditorContext';
import { TipTapEditor } from '../../../tiptap/TipTapEditor';
import { RichTextToolbar } from '../../Toolbar/RichTextToolbar';
import type { Editor } from '@tiptap/core';
import styles from '../../../styles/blocks.module.css';
import tiptapStyles from '../../../styles/tiptap.module.css';

interface TextBlockProps {
  block: Block;
}

const TextBlockInner = function TextBlock({ block }: TextBlockProps) {
  const dispatch = useEditorDispatch();
  const { setActiveEditor } = useMethodsContext();
  const editorRef = useRef<Editor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Track the editor instance in state so the effect has a proper dependency
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // Force toolbar re-render when editor formatting state changes (selection/transaction)
  const [, forceToolbarUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!editorInstance) return;

    const onStateChange = () => forceToolbarUpdate();
    editorInstance.on('selectionUpdate', onStateChange);
    editorInstance.on('transaction', onStateChange);

    return () => {
      editorInstance.off('selectionUpdate', onStateChange);
      editorInstance.off('transaction', onStateChange);
    };
  }, [editorInstance]);

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

  // Cleanup blur timer on unmount
  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const handleBlur = useCallback(() => {
    if (blurTimerRef.current !== null) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      blurTimerRef.current = null;
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
    setEditorInstance(editor);
  }, []);

  const p = block.properties;
  const wrapperStyle = useMemo(() => ({
    fontFamily: p.fontFamily,
    fontSize: p.fontSize,
    color: p.color,
    lineHeight: p.lineHeight,
    padding: p.padding,
    fontWeight: p.fontWeight,
    textTransform: p.textTransform,
    letterSpacing: p.letterSpacing,
  }), [p.fontFamily, p.fontSize, p.color, p.lineHeight, p.padding, p.fontWeight, p.textTransform, p.letterSpacing]);

  return (
    <div className={`ee-block-text ${styles.textBlock}`} ref={wrapperRef}>
      {isFocused && editorRef.current && (
        <div className={styles.textBlockToolbar}>
          <RichTextToolbar editor={editorRef.current} />
        </div>
      )}
      <div style={wrapperStyle}>
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
};

export const TextBlock = React.memo(TextBlockInner);
