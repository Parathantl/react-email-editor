import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { EmailEditorProps, EmailEditorRef, BlockType } from '../types';
import { EditorProvider, useEditorDispatch, useTemplateContext, useSelectionContext, useConfigContext, useMethodsContext } from '../context/EditorContext';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfirmDialog } from './ConfirmDialog';
import { Toolbar } from './Toolbar/Toolbar';
import { Sidebar } from './Sidebar/Sidebar';
import { Canvas } from './Canvas/Canvas';
import { PropertiesPanel } from './Properties/PropertiesPanel';
import { PreviewPanel } from './Preview/PreviewPanel';
import { SourceEditor } from './SourceEditor/SourceEditor';
import { generateMJML } from '../mjml/generator';
import { compileMJMLToHTML } from '../mjml/compiler';
import { parseMJML } from '../mjml/parser';
import { createSection, createBlock } from '../utils/factory';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';
import { extractVariableKeys } from '../utils/variables';
import { sanitizeTemplate } from '../utils/validate';
import { DND_TYPES } from '../utils/dnd';
import editorStyles from '../styles/editor.module.css';
import '../styles/variables.css';

const EditorInner = forwardRef<EmailEditorRef, EmailEditorProps>(function EditorInner(
  props,
  ref,
) {
  const dispatch = useEditorDispatch();
  const { template, activeTab } = useTemplateContext();
  const selection = useSelectionContext();
  const { clearPersisted } = useConfigContext();
  const { getActiveEditor } = useMethodsContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const { onReady, onSave, customIcons } = props;

  // Panel toggle state for responsive layout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);

  // Confirm dialog state for keyboard-triggered removal
  const [pendingRemoval, setPendingRemoval] = useState<
    | { type: 'block'; sectionId: string; columnId: string; blockId: string }
    | { type: 'section'; sectionId: string }
    | null
  >(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
    setPropertiesOpen(false);
  }, []);

  const toggleProperties = useCallback(() => {
    setPropertiesOpen((prev) => !prev);
    setSidebarOpen(false);
  }, []);

  const closeOverlays = useCallback(() => {
    setSidebarOpen(false);
    setPropertiesOpen(false);
  }, []);

  // Auto-open properties panel when a block is selected (on narrow screens)
  useEffect(() => {
    if (selection.blockId) {
      // Only auto-open if window is narrow (overlay mode)
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setPropertiesOpen(true);
        setSidebarOpen(false);
      }
    }
  }, [selection.blockId]);

  // Feature 3: onReady — fire once on mount
  useEffect(() => {
    onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use refs for keyboard handler to avoid re-registering on every state change
  const templateRef = useRef(template);
  templateRef.current = template;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const getActiveEditorRef = useRef(getActiveEditor);
  getActiveEditorRef.current = getActiveEditor;

  // Feature 5: Keyboard shortcuts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd+S → save
      if (mod && key === 's') {
        e.preventDefault();
        if (onSaveRef.current) {
          const mjml = generateMJML(templateRef.current);
          compileMJMLToHTML(mjml).then((result) => onSaveRef.current!(mjml, result.html));
        }
        return;
      }

      // Escape → deselect all
      if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_BLOCK', payload: null });
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      const isUndoKey = mod && key === 'z' && !e.shiftKey;
      const isRedoKey = mod && ((key === 'z' && e.shiftKey) || key === 'y');

      // While typing inside a TipTap text block, fall through to editor-level
      // undo/redo only when TipTap's own history is exhausted. This keeps
      // fine-grained text undo while writing, but still gives the user a
      // useful Cmd+Z when there's nothing left to undo within the block.
      // For inputs/textareas, defer entirely to the browser's native undo.
      if (isEditing && (isUndoKey || isRedoKey)) {
        if (target.isContentEditable && !e.defaultPrevented) {
          // TipTap runs first (target/keymap phase). If it handled the key,
          // it sets defaultPrevented. If not (history empty), we take over.
          const tipTap = getActiveEditorRef.current?.();
          const stillCanHandle = tipTap && !tipTap.isDestroyed && tipTap.isFocused
            ? (isUndoKey ? tipTap.can().undo() : tipTap.can().redo())
            : false;
          if (!stillCanHandle) {
            e.preventDefault();
            dispatch({ type: isUndoKey ? 'UNDO' : 'REDO' });
          }
        }
        return;
      }

      // Skip remaining shortcuts while typing in inputs
      if (isEditing) return;

      // Ctrl/Cmd+Z → undo
      if (isUndoKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y → redo
      if (isRedoKey) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      // Delete/Backspace → confirm then remove selected block or section
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { sectionId, columnId, blockId } = selectionRef.current;
        if (blockId && sectionId && columnId) {
          e.preventDefault();
          setPendingRemoval({ type: 'block', sectionId, columnId, blockId });
        } else if (sectionId) {
          e.preventDefault();
          setPendingRemoval({ type: 'section', sectionId });
        }
      }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [dispatch]);

  // Drag boundary + selection guard + auto-scroll while dragging.
  //   - boundary: forbid drops outside the email canvas-body.
  //   - selection guard: while dragging, disable text selection on the
  //     editor (otherwise mousedown on a drag handle starts a selection
  //     that extends across blocks and into the right sidebar).
  //   - auto-scroll: when the cursor approaches the top or bottom of the
  //     canvas viewport during a drag, scroll the canvas-wrapper so the
  //     user can drop on rows that aren't currently visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const draggingClass = editorStyles['ee-editor-is-dragging'];
    let isDraggingActive = false;

    const SCROLL_THRESHOLD = 60; // px from edge to trigger scroll
    const MAX_SCROLL_SPEED = 14; // px per animation frame at the very edge
    let scrollDelta = 0;
    let rafId: number | null = null;

    const tick = () => {
      const wrapper = el.querySelector('.ee-canvas-wrapper') as HTMLElement | null;
      if (wrapper && scrollDelta !== 0) {
        wrapper.scrollTop += scrollDelta;
      }
      rafId = scrollDelta !== 0 ? requestAnimationFrame(tick) : null;
    };

    const stopAutoScroll = () => {
      scrollDelta = 0;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handler = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const types = e.dataTransfer.types;
      const isInternalDrag =
        types.includes(DND_TYPES.BLOCK_ID) ||
        types.includes(DND_TYPES.BLOCK_TYPE) ||
        types.includes(DND_TYPES.SECTION_MOVE);
      if (!isInternalDrag) {
        stopAutoScroll();
        return;
      }

      if (!isDraggingActive) {
        isDraggingActive = true;
        el.classList.add(draggingClass);
      }

      // Auto-scroll: when cursor is near the top/bottom of the canvas
      // viewport, scroll proportional to how close to the edge it is.
      const wrapper = el.querySelector('.ee-canvas-wrapper') as HTMLElement | null;
      if (wrapper) {
        const wrect = wrapper.getBoundingClientRect();
        const inHorizontalRange = e.clientX >= wrect.left && e.clientX <= wrect.right;
        if (inHorizontalRange) {
          const fromTop = e.clientY - wrect.top;
          const fromBottom = wrect.bottom - e.clientY;
          if (fromTop >= 0 && fromTop < SCROLL_THRESHOLD) {
            scrollDelta = -Math.ceil(((SCROLL_THRESHOLD - fromTop) / SCROLL_THRESHOLD) * MAX_SCROLL_SPEED);
          } else if (fromBottom >= 0 && fromBottom < SCROLL_THRESHOLD) {
            scrollDelta = Math.ceil(((SCROLL_THRESHOLD - fromBottom) / SCROLL_THRESHOLD) * MAX_SCROLL_SPEED);
          } else {
            scrollDelta = 0;
          }
          if (scrollDelta !== 0 && rafId === null) {
            rafId = requestAnimationFrame(tick);
          }
        } else {
          scrollDelta = 0;
        }
      }

      const canvasBody = el.querySelector('.ee-canvas-body');
      if (!canvasBody) return;
      const rect = canvasBody.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) {
        // preventDefault + dropEffect='none' = browser shows no-drop cursor
        // and suppresses the drop event entirely if released here.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
      }
    };

    const clear = () => {
      if (isDraggingActive) {
        isDraggingActive = false;
        el.classList.remove(draggingClass);
      }
      stopAutoScroll();
    };

    el.addEventListener('dragover', handler);
    window.addEventListener('dragend', clear);
    window.addEventListener('drop', clear);
    return () => {
      el.removeEventListener('dragover', handler);
      window.removeEventListener('dragend', clear);
      window.removeEventListener('drop', clear);
      stopAutoScroll();
    };
  }, []);

  const handleConfirmRemoval = useCallback(() => {
    if (!pendingRemoval) return;
    if (pendingRemoval.type === 'block') {
      dispatch({ type: 'REMOVE_BLOCK', payload: pendingRemoval });
    } else {
      dispatch({ type: 'REMOVE_SECTION', payload: { sectionId: pendingRemoval.sectionId } });
    }
    setPendingRemoval(null);
  }, [dispatch, pendingRemoval]);

  useImperativeHandle(ref, () => ({
    getMJML: () => generateMJML(templateRef.current),

    getHTML: async () => {
      const mjml = generateMJML(templateRef.current);
      const result = await compileMJMLToHTML(mjml);
      return result.html;
    },

    getJSON: () => JSON.parse(JSON.stringify(templateRef.current)),

    loadMJML: (source: string) => {
      // Wrap parsing so a malformed input (e.g. server returned garbage) doesn't
      // bubble up as an uncaught render-time exception. Editor state is left
      // untouched on failure; consumers can still try/catch to show their own UI.
      let parsed;
      try {
        parsed = parseMJML(source);
      } catch (err) {
        console.error('[EmailEditor] loadMJML failed to parse input:', err);
        throw err;
      }
      dispatch({ type: 'SET_TEMPLATE', payload: sanitizeTemplate(parsed) });
    },

    loadJSON: (t) => {
      // Run the consumer-supplied template through the same sanitizer the
      // localStorage adapter uses, so unknown block types and missing fields
      // don't put the reducer in a state the renderer can't handle.
      dispatch({ type: 'SET_TEMPLATE', payload: sanitizeTemplate(t) });
    },

    insertBlock: (type: BlockType, sectionIdx?: number) => {
      const currentTemplate = templateRef.current;
      const targetSection = currentTemplate.sections[sectionIdx ?? currentTemplate.sections.length - 1];
      const block = createBlock(type);

      if (!targetSection) {
        // Use combined action to avoid stale-data race condition
        const newSection = createSection();
        dispatch({ type: 'ADD_SECTION_WITH_BLOCK', payload: { section: newSection, block } });
      } else {
        const column = targetSection.columns[0];
        dispatch({
          type: 'ADD_BLOCK',
          payload: { sectionId: targetSection.id, columnId: column.id, block },
        });
      }
    },

    getVariables: () => {
      const mjml = generateMJML(templateRef.current);
      return extractVariableKeys(mjml);
    },

    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),

    reset: () => {
      dispatch({
        type: 'SET_TEMPLATE',
        payload: { sections: [], globalStyles: { ...DEFAULT_GLOBAL_STYLES }, headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] } },
      });
    },

    clearPersisted: () => clearPersisted(),

    exportPDF: async () => {
      const mjml = generateMJML(templateRef.current);
      const result = await compileMJMLToHTML(mjml);
      const printStyles = `
        <style>
          @page { margin: 0; size: auto; }
          @media print {
            html, body { margin: 0; padding: 0; }
          }
        </style>
      `;
      const htmlWithPrintStyles = result.html.replace(
        '</head>',
        `${printStyles}</head>`,
      );
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(htmlWithPrintStyles);
      doc.close();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    },
  }), [dispatch, clearPersisted]);

  const sidebarClasses = [
    editorStyles['ee-editor-panel'],
    editorStyles['ee-sidebar-panel'],
    sidebarOpen ? editorStyles['ee-sidebar-open'] : '',
  ].filter(Boolean).join(' ');

  const propertiesClasses = [
    editorStyles['ee-editor-panel'],
    editorStyles['ee-properties-panel'],
    propertiesOpen ? editorStyles['ee-properties-open'] : '',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    editorStyles['ee-panel-overlay'],
    (sidebarOpen || propertiesOpen) ? editorStyles['ee-panel-overlay-visible'] : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={`ee-editor ${editorStyles['ee-editor-container']}`} tabIndex={-1}>
      {pendingRemoval && (
        <ConfirmDialog
          title={pendingRemoval.type === 'block' ? 'Remove Block' : 'Remove Section'}
          message={
            pendingRemoval.type === 'block'
              ? 'Are you sure you want to remove this block? This action can be undone with Ctrl+Z.'
              : 'Are you sure you want to remove this section and all its contents? This action can be undone with Ctrl+Z.'
          }
          onConfirm={handleConfirmRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
      <Toolbar
        sidebarOpen={sidebarOpen}
        propertiesOpen={propertiesOpen}
        onToggleSidebar={toggleSidebar}
        onToggleProperties={toggleProperties}
        toolbarActions={props.toolbarActions}
        customIcons={customIcons}
      />
      <div className={editorStyles['ee-editor-body']}>
        {activeTab === 'visual' && (
          <>
            <div className={`ee-sidebar ${sidebarClasses}`}>
              <ErrorBoundary>
                <Sidebar blockDefinitions={props.blockDefinitions} customIcons={customIcons} />
              </ErrorBoundary>
            </div>
            <div className={`ee-canvas ${editorStyles['ee-editor-panel']} ${editorStyles['ee-canvas-panel']}`}>
              <ErrorBoundary>
                <Canvas customIcons={customIcons} />
              </ErrorBoundary>
            </div>
            <div className={`ee-properties ${propertiesClasses}`}>
              <ErrorBoundary>
                <PropertiesPanel />
              </ErrorBoundary>
            </div>
            {/* Backdrop overlay for narrow screens */}
            <div className={overlayClasses} onClick={closeOverlays} />
          </>
        )}
        {activeTab === 'source' && (
          <div className={`ee-source-layout ${editorStyles['ee-source-layout']}`}>
            <div className={`ee-source-pane ${editorStyles['ee-source-pane']}`}>
              <ErrorBoundary>
                <SourceEditor />
              </ErrorBoundary>
            </div>
            <div className={`ee-preview-pane ${editorStyles['ee-source-pane-divider']}`}>
              <ErrorBoundary>
                <PreviewPanel customIcons={customIcons} />
              </ErrorBoundary>
            </div>
          </div>
        )}
        {activeTab === 'preview' && (
          <ErrorBoundary>
            <PreviewPanel customIcons={customIcons} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
});

export const EmailEditor = forwardRef<EmailEditorRef, EmailEditorProps>(
  function EmailEditor(props, ref) {
    const {
      initialTemplate,
      initialMJML,
      variables,
      initialCustomVariables,
      imageUploadAdapter,
      onChange,
      onVariablesChange,
      fontFamilies,
      fontSizes,
      colorPresets,
      onColorPresetsChange,
      persistenceKey,
      persistenceAdapter,
      className,
      style,
      onBlockAdd,
      onBlockRemove,
      onBlockUpdate,
      onSectionAdd,
      onSectionRemove,
      onSelectionChange,
      onTemplateLoad,
      onHistoryChange,
      customIcons,
      variableFormConfig,
    } = props;

    let template = initialTemplate;
    if (!template && initialMJML) {
      try {
        template = sanitizeTemplate(parseMJML(initialMJML));
      } catch {
        template = undefined;
      }
    }

    return (
      <EditorProvider
        initialTemplate={template}
        variables={variables}
        initialCustomVariables={initialCustomVariables}
        imageUploadAdapter={imageUploadAdapter}
        onChange={onChange}
        onVariablesChange={onVariablesChange}
        fontFamilies={fontFamilies}
        fontSizes={fontSizes}
        colorPresets={colorPresets}
        onColorPresetsChange={onColorPresetsChange}
        persistenceKey={persistenceKey}
        persistenceAdapter={persistenceAdapter}
        onBlockAdd={onBlockAdd}
        onBlockRemove={onBlockRemove}
        onBlockUpdate={onBlockUpdate}
        onSectionAdd={onSectionAdd}
        onSectionRemove={onSectionRemove}
        onSelectionChange={onSelectionChange}
        onTemplateLoad={onTemplateLoad}
        onHistoryChange={onHistoryChange}
        customIcons={customIcons}
        variableFormConfig={variableFormConfig}
      >
        <div className={`ee-editor-wrapper ${editorStyles['ee-editor-wrapper']} ${className || ''}`} style={style}>
          <EditorInner ref={ref} {...props} />
        </div>
      </EditorProvider>
    );
  },
);
