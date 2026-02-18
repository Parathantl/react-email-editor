import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { compileMJMLToHTML } from '../../mjml/compiler';
import { parseMJML } from '../../mjml/parser';
import type { ActiveTab } from '../../types';
import styles from '../../styles/toolbar.module.css';
import editorStyles from '../../styles/editor.module.css';

interface ToolbarProps {
  sidebarOpen?: boolean;
  propertiesOpen?: boolean;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
}

export function Toolbar({ sidebarOpen, propertiesOpen, onToggleSidebar, onToggleProperties }: ToolbarProps) {
  const { template, activeTab, historyIndex, history } = useTemplateContext();
  const dispatch = useEditorDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return;
    const handleClick = () => setExportOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [exportOpen]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
    const mjml = generateMJML(template);
    const blob = new Blob([mjml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.mjml';
    a.click();
    URL.revokeObjectURL(url);
  }, [template]);

  const handleExportHTML = useCallback(async () => {
    const mjml = generateMJML(template);
    const result = await compileMJMLToHTML(mjml);
    const blob = new Blob([result.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [template]);

  const handleExportPDF = useCallback(async () => {
    const mjml = generateMJML(template);
    const result = await compileMJMLToHTML(mjml);
    const printStyles = `
      <style>
        @page { margin: 0; size: auto; }
        @media print {
          html, body { margin: 0; padding: 0; }
        }
      </style>
    `;
    // Inject print styles into <head> to suppress browser headers/footers
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
  }, [template]);

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
    <div className={styles.toolbar} role="toolbar" aria-label="Editor toolbar">
      <div className={styles.toolbarGroup} role="group" aria-label="History">
        <button
          className={styles.toolbarBtn}
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          className={styles.toolbarBtn}
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
          className={`${styles.panelToggleBtn} ${sidebarOpen ? styles.panelToggleBtnActive : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-pressed={sidebarOpen}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <button
          className={`${styles.panelToggleBtn} ${propertiesOpen ? styles.panelToggleBtnActive : ''}`}
          onClick={onToggleProperties}
          aria-label="Toggle properties"
          aria-pressed={propertiesOpen}
          title="Toggle properties"
        >
          ⚙
        </button>
      </div>

      <div className={styles.toolbarSeparator} role="separator" />

      <div className={styles.tabBar} role="tablist" aria-label="Editor views">
        {(['visual', 'source', 'preview'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.toolbarSpacer} />

      <div className={styles.toolbarGroup} role="group" aria-label="Import/Export">
        <button
          className={styles.toolbarBtn}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import MJML file"
        >
          Import
        </button>
        <div className={styles.exportWrapper}>
          <button
            className={styles.toolbarBtn}
            onClick={(e) => { e.stopPropagation(); setExportOpen((prev) => !prev); }}
            aria-label="Export template"
            aria-expanded={exportOpen}
            aria-haspopup="true"
          >
            Export
          </button>
          {exportOpen && (
            <div className={styles.exportDropdown} role="menu">
              <button className={styles.exportDropdownItem} onClick={handleExportMJML} role="menuitem">MJML</button>
              <button className={styles.exportDropdownItem} onClick={handleExportHTML} role="menuitem">HTML</button>
              <button className={styles.exportDropdownItem} onClick={handleExportPDF} role="menuitem">PDF</button>
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
}
