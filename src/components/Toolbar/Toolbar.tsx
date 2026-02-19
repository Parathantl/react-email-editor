import React, { useCallback, useRef, useState, useEffect } from 'react';

import { useTemplateContext, useEditorDispatch, useHistoryContext } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { compileMJMLToHTML } from '../../mjml/compiler';
import { parseMJML } from '../../mjml/parser';
import type { ActiveTab, EmailTemplate } from '../../types';
import styles from '../../styles/toolbar.module.css';
import editorStyles from '../../styles/editor.module.css';

interface ToolbarProps {
  sidebarOpen?: boolean;
  propertiesOpen?: boolean;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
}

/**
 * Inner component that subscribes only to activeTab (not the full template).
 * Template is accessed via ref for export operations to avoid re-renders on every edit.
 */
export const Toolbar = React.memo(function Toolbar({ sidebarOpen, propertiesOpen, onToggleSidebar, onToggleProperties }: ToolbarProps) {
  const { template, activeTab } = useTemplateContext();
  const { canUndo, canRedo } = useHistoryContext();
  const dispatch = useEditorDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Keep a ref to the current template so export callbacks don't need template as a dependency.
  // Toolbar still re-renders on template changes (due to TemplateContext), but the export
  // callbacks remain stable (empty deps), reducing unnecessary child re-renders.
  const templateRef = useRef<EmailTemplate>(template);
  templateRef.current = template;

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return;
    const handleClick = () => setExportOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [exportOpen]);
  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    },
    [dispatch],
  );

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const handleExportMJML = useCallback(() => {
    const mjml = generateMJML(templateRef.current!);
    const blob = new Blob([mjml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.mjml';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportHTML = useCallback(async () => {
    const mjml = generateMJML(templateRef.current!);
    const result = await compileMJMLToHTML(mjml);
    const blob = new Blob([result.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.html';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPDF = useCallback(async () => {
    const mjml = generateMJML(templateRef.current!);
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
  }, []);

  const handleImportMJML = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const template = parseMJML(content);
          dispatch({ type: 'SET_TEMPLATE', payload: template });
        } catch (err) {
          console.error('Failed to parse MJML:', err);
        }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
    },
    [dispatch],
  );

  return (
    <div className={`ee-toolbar ${styles.toolbar}`} role="toolbar" aria-label="Editor toolbar">
      <div className={`ee-toolbar-history ${styles.toolbarGroup}`} role="group" aria-label="History">
        <button
          className={`ee-toolbar-undo ${styles.toolbarBtn}`}
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          className={`ee-toolbar-redo ${styles.toolbarBtn}`}
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          Redo
        </button>
      </div>

      {/* Panel toggles — visible only on narrow screens via CSS */}
      <div className={editorStyles.panelToggle}>
        <button
          className={`ee-toolbar-toggle-sidebar ${styles.panelToggleBtn} ${sidebarOpen ? styles.panelToggleBtnActive : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-pressed={sidebarOpen}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <button
          className={`ee-toolbar-toggle-properties ${styles.panelToggleBtn} ${propertiesOpen ? styles.panelToggleBtnActive : ''}`}
          onClick={onToggleProperties}
          aria-label="Toggle properties"
          aria-pressed={propertiesOpen}
          title="Toggle properties"
        >
          ⚙
        </button>
      </div>

      <div className={`ee-toolbar-separator ${styles.toolbarSeparator}`} role="separator" />

      <div className={`ee-toolbar-tabs ${styles.tabBar}`} role="tablist" aria-label="Editor views">
        {(['visual', 'source', 'preview'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`ee-toolbar-tab ee-toolbar-tab--${tab} ${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.toolbarSpacer} />

      <div className={`ee-toolbar-io ${styles.toolbarGroup}`} role="group" aria-label="Import/Export">
        <button
          className={`ee-toolbar-import ${styles.toolbarBtn}`}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import MJML file"
        >
          Import
        </button>
        <div className={`ee-toolbar-export ${styles.exportWrapper}`}>
          <button
            className={`ee-toolbar-export-btn ${styles.toolbarBtn}`}
            onClick={(e) => { e.stopPropagation(); setExportOpen((prev) => !prev); }}
            aria-label="Export template"
            aria-expanded={exportOpen}
            aria-haspopup="true"
          >
            Export
          </button>
          {exportOpen && (
            <div className={`ee-toolbar-export-dropdown ${styles.exportDropdown}`} role="menu">
              <button className={`ee-toolbar-export-mjml ${styles.exportDropdownItem}`} onClick={handleExportMJML} role="menuitem">MJML</button>
              <button className={`ee-toolbar-export-html ${styles.exportDropdownItem}`} onClick={handleExportHTML} role="menuitem">HTML</button>
              <button className={`ee-toolbar-export-pdf ${styles.exportDropdownItem}`} onClick={handleExportPDF} role="menuitem">PDF</button>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mjml,.xml,.txt"
        onChange={handleImportMJML}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
});
