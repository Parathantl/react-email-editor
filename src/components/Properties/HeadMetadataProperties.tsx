import React, { useCallback } from 'react';
import type { HeadMetadata } from '../../types';
import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
import { PropertyField } from './PropertyField';
import styles from '../../styles/properties.module.css';

export function HeadMetadataProperties() {
  const { template } = useTemplateContext();
  const dispatch = useEditorDispatch();
  const metadata = template.headMetadata ?? { title: '', previewText: '', headStyles: [] };

  const update = useCallback(
    (props: Partial<HeadMetadata>) => {
      dispatch({ type: 'UPDATE_HEAD_METADATA', payload: props });
    },
    [dispatch],
  );

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="text" label="Email Title" value={metadata.title} onChange={(v) => update({ title: v })} placeholder="Email title (mj-title)" />
      <PropertyField type="text" label="Preview Text" value={metadata.previewText} onChange={(v) => update({ previewText: v })} placeholder="Preview text shown in inbox (mj-preview)" />
      <PropertyField
        type="textarea"
        label="Custom Styles"
        value={metadata.headStyles.join('\n\n')}
        onChange={(v) => {
          const headStyles = v.trim() ? [v] : [];
          update({ headStyles });
        }}
        placeholder="Custom CSS (mj-style)"
        rows={6}
        code
      />
    </div>
  );
}
