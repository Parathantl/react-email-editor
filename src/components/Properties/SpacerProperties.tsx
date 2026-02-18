import React, { useCallback } from 'react';
import type { Block, SpacerBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { SliderInput } from './controls/SliderInput';
import styles from '../../styles/properties.module.css';

interface SpacerPropertiesProps {
  block: Block;
}

export function SpacerProperties({ block }: SpacerPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;
  const heightNum = parseInt(p.height, 10) || 20;

  const update = useCallback(
    (props: Partial<SpacerBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <SliderInput
        label="Height"
        value={heightNum}
        min={5}
        max={200}
        step={5}
        unit="px"
        onChange={(val) => update({ height: `${val}px` })}
      />
    </div>
  );
}
