import React, { useCallback } from 'react';
import type { Block, VideoBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import styles from '../../styles/properties.module.css';

interface VideoPropertiesProps {
  block: Block;
}

function getAutoThumbnail(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return '';
}

export function VideoProperties({ block }: VideoPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<VideoBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  const handleVideoUrlChange = useCallback(
    (src: string) => {
      const updates: Partial<VideoBlockProperties> = { src };
      // Auto-generate thumbnail if not manually set
      if (!p.thumbnailUrl) {
        const auto = getAutoThumbnail(src);
        if (auto) updates.thumbnailUrl = auto;
      }
      update(updates);
    },
    [update, p.thumbnailUrl],
  );

  const handleAutoThumbnail = useCallback(() => {
    const auto = getAutoThumbnail(p.src);
    if (auto) update({ thumbnailUrl: auto });
  }, [update, p.src]);

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Video URL</label>
        <input
          className={styles.fieldInput}
          value={p.src}
          onChange={(e) => handleVideoUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Thumbnail URL</label>
        <input
          className={styles.fieldInput}
          value={p.thumbnailUrl}
          onChange={(e) => update({ thumbnailUrl: e.target.value })}
          placeholder="https://..."
        />
        {p.src && (
          <button
            className={`ee-auto-thumbnail ${styles.fieldBtnUpload} ${styles.fieldInputStacked}`}
            onClick={handleAutoThumbnail}
          >
            Auto-generate from URL
          </button>
        )}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Alt Text</label>
        <input
          className={styles.fieldInput}
          value={p.alt}
          onChange={(e) => update({ alt: e.target.value })}
          placeholder="Video description"
        />
      </div>
      <AlignmentPicker
        label="Alignment"
        value={p.align}
        onChange={(align) => update({ align })}
      />
      <PaddingInput
        label="Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
    </div>
  );
}
