import React, { useCallback } from 'react';
import type { Block, TextBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { PaddingInput } from './controls/PaddingInput';
import styles from '../../styles/properties.module.css';

interface TextPropertiesProps {
  block: Block;
}

export function TextProperties({ block }: TextPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<TextBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <p className={styles.fieldHint}>
        Use the inline toolbar above the text block to format font, size, color, and alignment.
      </p>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Line Height</label>
        <input
          className={styles.fieldInput}
          value={p.lineHeight}
          onChange={(e) => update({ lineHeight: e.target.value })}
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
