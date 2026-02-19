import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { EmailEditorProps, EmailEditorRef, BlockType } from '../types';
import { EditorProvider, useEditorDispatch, useTemplateContext, useSelectionContext, useConfigContext } from '../context/EditorContext';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { onReady, onSave } = props;

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

      // Ctrl/Cmd+S → save
      if (mod && e.key === 's') {
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

      // Skip remaining shortcuts while typing in inputs
      if (isEditing) return;

      // Ctrl/Cmd+Z → undo
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y → redo
      if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
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
      const parsed = parseMJML(source);
      dispatch({ type: 'SET_TEMPLATE', payload: parsed });
    },

    loadJSON: (t) => {
      dispatch({ type: 'SET_TEMPLATE', payload: t });
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
    editorStyles.editorPanel,
    editorStyles.sidebarPanel,
    sidebarOpen ? editorStyles.sidebarOpen : '',
  ].filter(Boolean).join(' ');

  const propertiesClasses = [
    editorStyles.editorPanel,
    editorStyles.propertiesPanel,
    propertiesOpen ? editorStyles.propertiesOpen : '',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    editorStyles.panelOverlay,
    (sidebarOpen || propertiesOpen) ? editorStyles.panelOverlayVisible : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={`ee-editor ${editorStyles.editorContainer}`} tabIndex={-1}>
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
      />
      <div className={editorStyles.editorBody}>
        {activeTab === 'visual' && (
          <>
            <div className={`ee-sidebar ${sidebarClasses}`}>
              <ErrorBoundary>
                <Sidebar blockDefinitions={props.blockDefinitions} />
              </ErrorBoundary>
            </div>
            <div className={`ee-canvas ${editorStyles.editorPanel} ${editorStyles.canvasPanel}`}>
              <ErrorBoundary>
                <Canvas />
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
          <div className={`ee-source-layout ${editorStyles.sourceLayout}`}>
            <div className={`ee-source-pane ${editorStyles.sourcePane}`}>
              <ErrorBoundary>
                <SourceEditor />
              </ErrorBoundary>
            </div>
            <div className={`ee-preview-pane ${editorStyles.sourcePaneDivider}`}>
              <ErrorBoundary>
                <PreviewPanel />
              </ErrorBoundary>
            </div>
          </div>
        )}
        {activeTab === 'preview' && (
          <ErrorBoundary>
            <PreviewPanel />
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
      imageUploadAdapter,
      onChange,
      onVariablesChange,
      fontFamilies,
      fontSizes,
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
    } = props;

    let template = initialTemplate;
    if (!template && initialMJML) {
      try {
        template = parseMJML(initialMJML);
      } catch {
        template = undefined;
      }
    }

    return (
      <EditorProvider
        initialTemplate={template}
        variables={variables}
        imageUploadAdapter={imageUploadAdapter}
        onChange={onChange}
        onVariablesChange={onVariablesChange}
        fontFamilies={fontFamilies}
        fontSizes={fontSizes}
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
      >
        <div className={`ee-editor-wrapper ${editorStyles.editorWrapper} ${className || ''}`} style={style}>
          <EditorInner ref={ref} {...props} />
        </div>
      </EditorProvider>
    );
  },
);
