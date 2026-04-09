import React, { useCallback, useRef, useState, useEffect } from 'react';

import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
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
  toolbarActions?: React.ReactNode;
  customIcons?: Record<string, React.ReactNode>;
}

/**
 * Inner component that subscribes only to activeTab (not the full template).
 * Template is accessed via ref for export operations to avoid re-renders on every edit.
 */
export const Toolbar = React.memo(function Toolbar({ sidebarOpen, propertiesOpen, onToggleSidebar, onToggleProperties, toolbarActions, customIcons }: ToolbarProps) {
  const { template, activeTab } = useTemplateContext();
  const dispatch = useEditorDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const sidebarIcon = customIcons?.sidebar ?? '📚';
  const propertiesIcon = customIcons?.properties ?? '⚙️';
  const tabIcons: Record<ActiveTab, React.ReactNode> = {
    visual: customIcons?.visual ?? '🎨',
    source: customIcons?.source ?? '🧾',
    preview: customIcons?.preview ?? '👁️',
  };

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
    <div className={`ee-toolbar ${styles['ee-toolbar']}`} role="toolbar" aria-label="Editor toolbar">
      {/* Panel toggles — visible only on narrow screens via CSS */}
      <div className={editorStyles['ee-panel-toggle']}>
        <button
          className={`ee-toolbar-toggle-sidebar ${styles['ee-panel-toggle-btn']} ${sidebarOpen ? styles['ee-panel-toggle-btn-active'] : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-pressed={sidebarOpen}
          title="Toggle sidebar"
        >
          {sidebarIcon}
        </button>
        <button
          className={`ee-toolbar-toggle-properties ${styles['ee-panel-toggle-btn']} ${propertiesOpen ? styles['ee-panel-toggle-btn-active'] : ''}`}
          onClick={onToggleProperties}
          aria-label="Toggle properties"
          aria-pressed={propertiesOpen}
          title="Toggle properties"
        >
          {propertiesIcon}
        </button>
      </div>

      <div className={`ee-toolbar-separator ${styles['ee-toolbar-separator']}`} role="separator" />

      <div className={`ee-toolbar-tabs ${styles['ee-tab-bar']}`} role="tablist" aria-label="Editor views">
        {(['visual', 'source', 'preview'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`ee-toolbar-tab ee-toolbar-tab--${tab} ${styles['ee-tab-btn']} ${activeTab === tab ? styles['ee-tab-btn-active'] : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="ee-toolbar-tab-icon">
              {tabIcons[tab]}
            </span>
            <span className="ee-toolbar-tab-label">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>

          </button>
        ))}
      </div>

      <div className={styles['ee-toolbar-spacer']} />

      <div className={`ee-toolbar-io ${styles['ee-toolbar-group']}`} role="group" aria-label="Import/Export">
        <button
          className={`ee-toolbar-import ${styles['ee-toolbar-btn']}`}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import MJML file"
        >
          Import
        </button>
        <div className={`ee-toolbar-export ${styles['ee-export-wrapper']}`}>
          <button
            className={`ee-toolbar-export-btn ${styles['ee-toolbar-btn']}`}
            onClick={(e) => { e.stopPropagation(); setExportOpen((prev) => !prev); }}
            aria-label="Export template"
            aria-expanded={exportOpen}
            aria-haspopup="true"
          >
            Export
          </button>
          {exportOpen && (
            <div className={`ee-toolbar-export-dropdown ${styles['ee-export-dropdown']}`} role="menu">
              <button className={`ee-toolbar-export-mjml ${styles['ee-export-dropdown-item']}`} onClick={handleExportMJML} role="menuitem">MJML</button>
              <button className={`ee-toolbar-export-html ${styles['ee-export-dropdown-item']}`} onClick={handleExportHTML} role="menuitem">HTML</button>
              <button className={`ee-toolbar-export-pdf ${styles['ee-export-dropdown-item']}`} onClick={handleExportPDF} role="menuitem">PDF</button>
            </div>
          )}
        </div>
      </div>

      {toolbarActions && (
        <div className={`ee-toolbar-actions ${styles['ee-toolbar-group']}`}>
          {toolbarActions}
        </div>
      )}

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
