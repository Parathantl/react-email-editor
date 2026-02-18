import React from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface VideoBlockProps {
  block: Block;
}

export function VideoBlock({ block }: VideoBlockProps) {
  const p = block.properties;
  const alignClass = p.align === 'left' ? styles.videoBlockLeft
    : p.align === 'right' ? styles.videoBlockRight
    : styles.videoBlockCenter;

  const thumbnailUrl = p.thumbnailUrl || getAutoThumbnail(p.src);

  if (!thumbnailUrl && !p.src) {
    return (
      <div className={`${styles.videoBlock} ${alignClass}`} style={{ padding: p.padding }}>
        <div className={styles.videoPlaceholder}>
          <span style={{ fontSize: '32px' }}>&#9654;</span>
          <span>Video Block</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.videoBlock} ${alignClass}`} style={{ padding: p.padding }}>
      <div className={styles.videoPreview}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={p.alt} style={{ maxWidth: '100%', display: 'block' }} />
        ) : (
          <div className={styles.videoPlaceholder}>
            <span style={{ fontSize: '32px' }}>&#9654;</span>
            <span>No thumbnail</span>
          </div>
        )}
        <div className={styles.playOverlay}>&#9654;</div>
      </div>
    </div>
  );
}

function getAutoThumbnail(url: string): string {
  if (!url) return '';
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  // Vimeo — can't auto-generate without API, return empty
  return '';
}
