import React, { useCallback } from 'react';
import type { Block, HtmlBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { PaddingInput } from './controls/PaddingInput';
import styles from '../../styles/properties.module.css';

interface HtmlPropertiesProps {
  block: Block;
}

export function HtmlProperties({ block }: HtmlPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<HtmlBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>HTML Content</label>
        <textarea
          className={styles.fieldInput}
          value={p.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="<p>Enter raw HTML here...</p>"
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        />
      </div>
      <PaddingInput
        label="Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
    </div>
  );
}
