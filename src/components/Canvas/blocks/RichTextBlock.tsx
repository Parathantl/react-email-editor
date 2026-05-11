import { useCallback, useRef, useState, useEffect, useReducer, useMemo, type CSSProperties } from 'react';
import type { Block, Variable } from '../../../types';
import { useEditorDispatch, useEditorVariables, useMethodsContext } from '../../../context/EditorContext';
import { TipTapEditor } from '../../../tiptap/TipTapEditor';
import { RichTextToolbar } from '../../Toolbar/RichTextToolbar';
import type { Editor } from '@tiptap/core';
import styles from '../../../styles/blocks.module.css';
import tiptapStyles from '../../../styles/tiptap.module.css';

export interface RichTextBlockProps {
  block: Block;
  wrapperClassName: string;
  placeholder: string;
  /** Override resolved font size (e.g. heading level fallback). Falls back to block.properties.fontSize. */
  fontSize?: string;
  /** Toolbar default font family for the family dropdown when no inline mark is set. */
  defaultFontFamily?: string;
  /** Toolbar default font size for the size dropdown when no inline mark is set. */
  defaultFontSize?: string;
}

/**
 * Shared rich-text block: wires a TipTap editor + floating toolbar to a block in the template.
 * Used by TextBlock and HeadingBlock.
 */
export function RichTextBlock({
  block,
  wrapperClassName,
  placeholder,
  fontSize: fontSizeOverride,
  defaultFontFamily,
  defaultFontSize,
}: RichTextBlockProps) {
  const dispatch = useEditorDispatch();
  const { setActiveEditor } = useMethodsContext();
  const { variables, addCustomVariable } = useEditorVariables();
  const editorRef = useRef<Editor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blurRafRef = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // Refs keep the suggestion config reactive without re-creating the editor.
  const variablesRef = useRef(variables);
  variablesRef.current = variables;
  const addCustomVariableRef = useRef(addCustomVariable);
  addCustomVariableRef.current = addCustomVariable;

  const variableSuggestion = useMemo(
    () => ({
      getVariables: () => variablesRef.current,
      onAddVariable: (key: string): Variable | null => {
        const existing = variablesRef.current.find((v) => v.key === key);
        if (existing) return existing;
        // Leave `label` undefined so displayVariableName() renders a humanized
        // form consistently, and consumers can later set a custom label without
        // having to overwrite a snake_case placeholder.
        const created: Variable = { key, group: 'Custom' };
        addCustomVariableRef.current(created);
        return created;
      },
    }),
    [],
  );

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

  useEffect(() => {
    return () => {
      if (blurRafRef.current !== null) cancelAnimationFrame(blurRafRef.current);
    };
  }, []);

  const handleBlur = useCallback((event: FocusEvent) => {
    // If focus is moving to something inside the wrapper (e.g., a toolbar button),
    // keep the toolbar visible. relatedTarget is the synchronous "where focus is going" hint.
    const next = event.relatedTarget as Node | null;
    if (next && wrapperRef.current?.contains(next)) return;

    // relatedTarget can be null (focus moved to body, or to a non-focusable target).
    // Defer one frame so document.activeElement reflects the settled focus before we hide.
    if (blurRafRef.current !== null) cancelAnimationFrame(blurRafRef.current);
    blurRafRef.current = requestAnimationFrame(() => {
      blurRafRef.current = null;
      if (wrapperRef.current?.contains(document.activeElement)) return;
      if (editorRef.current && !editorRef.current.isFocused) {
        // Hide the per-block toolbar, but DO NOT clear the active editor.
        // External insert UIs (sidebar variable chips, {{ autocomplete) need
        // the last-focused editor as their insertion target — clearing it
        // here used to make sidebar inserts silently no-op when the click
        // arrived after blur (always on touch devices).
        setIsFocused(false);
      }
    });
  }, []);

  const handleEditorRef = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
    setEditorInstance(editor);
  }, []);

  const p = block.properties;
  const resolvedFontSize = fontSizeOverride ?? p.fontSize;

  const wrapperStyle = useMemo(() => {
    const style: CSSProperties = {
      fontFamily: p.fontFamily,
      fontSize: resolvedFontSize,
      color: p.color,
      lineHeight: p.lineHeight,
      padding: p.padding,
      textAlign: p.align,
      fontWeight: p.fontWeight,
      textTransform: p.textTransform,
      letterSpacing: p.letterSpacing,
      backgroundColor: p.backgroundColor && p.backgroundColor !== 'transparent' ? p.backgroundColor : undefined,
    };
    // Only text blocks carry paragraphSpacing; heading blocks leave the var unset.
    if (typeof p.paragraphSpacing === 'string' && p.paragraphSpacing) {
      (style as Record<string, string>)['--ee-paragraph-spacing'] = p.paragraphSpacing;
    }
    return style;
  }, [p.fontFamily, resolvedFontSize, p.color, p.lineHeight, p.padding, p.align, p.fontWeight, p.textTransform, p.letterSpacing, p.backgroundColor, p.paragraphSpacing]);

  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      {isFocused && editorInstance && (
        <div className={styles['ee-text-block-toolbar']}>
          <RichTextToolbar
            editor={editorInstance}
            defaultFontFamily={defaultFontFamily}
            defaultFontSize={defaultFontSize}
          />
        </div>
      )}
      <div style={wrapperStyle}>
        <TipTapEditor
          content={p.content}
          onUpdate={handleUpdate}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={tiptapStyles['ee-tiptap-wrapper']}
          editorRef={handleEditorRef}
          placeholder={placeholder}
          variableSuggestion={variableSuggestion}
        />
      </div>
    </div>
  );
}
