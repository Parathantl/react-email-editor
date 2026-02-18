import React, { useEffect, useState, useRef } from 'react';
import { useEditorState } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { compileMJMLToHTML } from '../../mjml/compiler';

type PreviewMode = 'desktop' | 'mobile';

const PREVIEW_WIDTHS: Record<PreviewMode, number> = {
  desktop: 600,
  mobile: 375,
};

export function PreviewPanel() {
  const state = useEditorState();
  const [html, setHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounce preview compilation to avoid excessive recompilations during rapid edits
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      async function compile() {
        const mjml = generateMJML(state.template);
        const result = await compileMJMLToHTML(mjml);
        if (!cancelled) {
          setHtml(result.html);
        }
      }
      compile();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.template]);

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  const toggleBtnBase: React.CSSProperties = {
    padding: '6px 16px',
    border: '1px solid var(--ee-border-color)',
    background: 'var(--ee-bg-panel)',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--ee-text-secondary)',
    transition: 'all 150ms ease',
  };

  const toggleBtnActive: React.CSSProperties = {
    ...toggleBtnBase,
    background: 'var(--ee-color-primary)',
    color: '#fff',
    borderColor: 'var(--ee-color-primary)',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, padding: '12px 24px 0' }} role="group" aria-label="Preview size">
        <button
          style={{
            ...(previewMode === 'desktop' ? toggleBtnActive : toggleBtnBase),
            borderRadius: 'var(--ee-border-radius-sm) 0 0 var(--ee-border-radius-sm)',
          }}
          onClick={() => setPreviewMode('desktop')}
          aria-pressed={previewMode === 'desktop'}
          aria-label="Desktop preview"
        >
          Desktop
        </button>
        <button
          style={{
            ...(previewMode === 'mobile' ? toggleBtnActive : toggleBtnBase),
            borderRadius: '0 var(--ee-border-radius-sm) var(--ee-border-radius-sm) 0',
            borderLeft: 'none',
          }}
          onClick={() => setPreviewMode('mobile')}
          aria-pressed={previewMode === 'mobile'}
          aria-label="Mobile preview"
        >
          Mobile
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
        <iframe
          ref={iframeRef}
          title="Email Preview"
          style={{
            width: PREVIEW_WIDTHS[previewMode],
            height: '100%',
            border: '1px solid var(--ee-border-color)',
            borderRadius: 'var(--ee-border-radius)',
            background: '#ffffff',
            transition: 'width 300ms ease',
          }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
