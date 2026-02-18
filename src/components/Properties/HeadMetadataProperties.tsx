import React, { useCallback } from 'react';
import type { HeadMetadata } from '../../types';
import { useEditor } from '../../context/EditorContext';
import styles from '../../styles/properties.module.css';

export function HeadMetadataProperties() {
  const { state, dispatch } = useEditor();
  const metadata = state.template.headMetadata ?? { title: '', previewText: '', headStyles: [] };

  const update = useCallback(
    (props: Partial<HeadMetadata>) => {
      dispatch({ type: 'UPDATE_HEAD_METADATA', payload: props });
    },
    [dispatch],
  );

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Email Title</label>
        <input
          className={styles.fieldInput}
          value={metadata.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Email title (mj-title)"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Preview Text</label>
        <input
          className={styles.fieldInput}
          value={metadata.previewText}
          onChange={(e) => update({ previewText: e.target.value })}
          placeholder="Preview text shown in inbox (mj-preview)"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Custom Styles</label>
        <textarea
          className={styles.fieldInput}
          value={metadata.headStyles.join('\n\n')}
          onChange={(e) => {
            const value = e.target.value;
            const headStyles = value.trim() ? [value] : [];
            update({ headStyles });
          }}
          placeholder="Custom CSS (mj-style)"
          rows={6}
          style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
        />
      </div>
    </div>
  );
}
