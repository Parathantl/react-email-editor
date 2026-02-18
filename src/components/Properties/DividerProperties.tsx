import React, { useCallback } from 'react';
import type { Block, DividerBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import styles from '../../styles/properties.module.css';

interface DividerPropertiesProps {
  block: Block;
}

export function DividerProperties({ block }: DividerPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<DividerBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <ColorPicker
        label="Border Color"
        value={p.borderColor}
        onChange={(borderColor) => update({ borderColor })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Border Width</label>
        <input
          className={styles.fieldInput}
          value={p.borderWidth}
          onChange={(e) => update({ borderWidth: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Border Style</label>
        <select
          className={styles.fieldSelect}
          value={p.borderStyle}
          onChange={(e) => update({ borderStyle: e.target.value })}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Width</label>
        <input
          className={styles.fieldInput}
          value={p.width}
          onChange={(e) => update({ width: e.target.value })}
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
