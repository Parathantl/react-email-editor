import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useTemplateContext } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { compileMJMLToHTML } from '../../mjml/compiler';
import styles from '../../styles/preview.module.css';

type PreviewMode = 'desktop' | 'mobile';

const PREVIEW_WIDTHS: Record<PreviewMode, number> = {
  desktop: 600,
  mobile: 375,
};

export function PreviewPanel({ customIcons }: { customIcons?: Record<string, ReactNode> }) {
  const { template } = useTemplateContext();
  const [html, setHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const desktopIcon = customIcons?.previewDesktop ?? '🖥️';
  const mobileIcon = customIcons?.previewMobile ?? '📱';

  // Debounce preview compilation to avoid excessive recompilations during rapid edits
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      async function compile() {
        const mjml = generateMJML(template);
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
  }, [template]);

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

  return (
    <div className={`ee-preview ${styles['ee-preview']}`}>
      <div className={`ee-preview-toggles ${styles['ee-preview-toggles']}`} role="group" aria-label="Preview size">
        <button
          className={`ee-preview-toggle ee-preview-toggle--desktop ${styles['ee-preview-toggle']} ${styles['ee-preview-toggle-desktop']} ${previewMode === 'desktop' ? `ee-preview-toggle--active ${styles['ee-preview-toggle-active']}` : ''}`}
          onClick={() => setPreviewMode('desktop')}
          aria-pressed={previewMode === 'desktop'}
          aria-label="Desktop preview"
        >
          {desktopIcon} Desktop
        </button>
        <button
          className={`ee-preview-toggle ee-preview-toggle--mobile ${styles['ee-preview-toggle']} ${styles['ee-preview-toggle-mobile']} ${previewMode === 'mobile' ? `ee-preview-toggle--active ${styles['ee-preview-toggle-active']}` : ''}`}
          onClick={() => setPreviewMode('mobile')}
          aria-pressed={previewMode === 'mobile'}
          aria-label="Mobile preview"
        >
          {mobileIcon} Mobile
        </button>
      </div>
      <div className={`ee-preview-container ${styles['ee-preview-container']}`}>
        <iframe
          className={`ee-preview-iframe ${styles['ee-preview-iframe']}`}
          ref={iframeRef}
          title="Email Preview"
          style={{ width: PREVIEW_WIDTHS[previewMode] }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
