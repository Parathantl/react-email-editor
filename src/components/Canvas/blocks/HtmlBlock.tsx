import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface HtmlBlockProps {
  block: Block;
}

export const HtmlBlock = React.memo(function HtmlBlock({ block }: HtmlBlockProps) {
  const p = block.properties;

  const sanitizedContent = useMemo(() => {
    if (!p.content) return '';
    return DOMPurify.sanitize(p.content, {
      ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'td', 'th'],
      ADD_ATTR: ['style', 'class', 'align', 'valign', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan', 'width', 'height'],
    });
  }, [p.content]);

  if (!p.content) {
    return (
      <div className={`ee-block-html ${styles.htmlBlock}`} style={{ padding: p.padding }}>
        <div className={styles.htmlPlaceholder}>
          <span>&lt;/&gt;</span>
          <span>Raw HTML Block</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ee-block-html ${styles.htmlBlock}`}
      style={{ padding: p.padding }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
});
