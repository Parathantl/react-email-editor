import React, { useCallback } from 'react';
import type { Block, CountdownBlockProperties } from '../../types';
import { narrowBlock } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import styles from '../../styles/properties.module.css';

interface CountdownPropertiesProps {
  block: Block;
}

export function CountdownProperties({ block }: CountdownPropertiesProps) {
  const dispatch = useEditorDispatch();

  const update = useCallback(
    (props: Partial<CountdownBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  if (!narrowBlock(block, 'countdown')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Target Date</label>
        <input
          className={styles.fieldInput}
          type="datetime-local"
          value={p.targetDate}
          onChange={(e) => update({ targetDate: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Label</label>
        <input
          className={styles.fieldInput}
          value={p.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>
      <div className={styles.separator} />
      <ColorPicker
        label="Digit Background"
        value={p.digitBackgroundColor}
        onChange={(digitBackgroundColor) => update({ digitBackgroundColor })}
      />
      <ColorPicker
        label="Digit Color"
        value={p.digitColor}
        onChange={(digitColor) => update({ digitColor })}
      />
      <ColorPicker
        label="Label Color"
        value={p.labelColor}
        onChange={(labelColor) => update({ labelColor })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Font Size</label>
        <input
          className={styles.fieldInput}
          value={p.fontSize}
          onChange={(e) => update({ fontSize: e.target.value })}
        />
      </div>
      <AlignmentPicker
        label="Alignment"
        value={p.align}
        onChange={(align) => update({ align: align as 'left' | 'center' | 'right' })}
      />
      <PaddingInput
        label="Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
    </div>
  );
}
