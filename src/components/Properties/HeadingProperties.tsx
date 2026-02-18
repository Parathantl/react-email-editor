import React, { useCallback } from 'react';
import type { Block, HeadingBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { PaddingInput } from './controls/PaddingInput';
import { FontPicker } from './controls/FontPicker';
import { ColorPicker } from './controls/ColorPicker';
import { AlignmentPicker } from './controls/AlignmentPicker';
import styles from '../../styles/properties.module.css';

interface HeadingPropertiesProps {
  block: Block;
}

const LEVEL_DEFAULTS: Record<string, { fontSize: string; lineHeight: string }> = {
  h1: { fontSize: '36px', lineHeight: '1.2' },
  h2: { fontSize: '28px', lineHeight: '1.3' },
  h3: { fontSize: '22px', lineHeight: '1.3' },
  h4: { fontSize: '18px', lineHeight: '1.4' },
};

export function HeadingProperties({ block }: HeadingPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<HeadingBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  const handleLevelChange = useCallback(
    (level: string) => {
      const defaults = LEVEL_DEFAULTS[level] || LEVEL_DEFAULTS.h2;
      update({ level: level as any, fontSize: defaults.fontSize, lineHeight: defaults.lineHeight });
    },
    [update],
  );

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Heading Level</label>
        <select
          className={styles.fieldSelect}
          value={p.level}
          onChange={(e) => handleLevelChange(e.target.value)}
        >
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
        </select>
      </div>
      <div className={styles.separator} />
      <FontPicker
        label="Font Family"
        value={p.fontFamily}
        onChange={(fontFamily) => update({ fontFamily })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Font Size</label>
        <input
          className={styles.fieldInput}
          value={p.fontSize}
          onChange={(e) => update({ fontSize: e.target.value })}
        />
      </div>
      <ColorPicker
        label="Color"
        value={p.color}
        onChange={(color) => update({ color })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Line Height</label>
        <input
          className={styles.fieldInput}
          value={p.lineHeight}
          onChange={(e) => update({ lineHeight: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Font Weight</label>
        <select
          className={styles.fieldSelect}
          value={p.fontWeight || 'bold'}
          onChange={(e) => update({ fontWeight: e.target.value })}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="300">300</option>
          <option value="400">400</option>
          <option value="500">500</option>
          <option value="600">600</option>
          <option value="700">700</option>
          <option value="800">800</option>
          <option value="900">900</option>
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Text Transform</label>
        <select
          className={styles.fieldSelect}
          value={p.textTransform || 'none'}
          onChange={(e) => update({ textTransform: e.target.value as HeadingBlockProperties['textTransform'] })}
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Letter Spacing</label>
        <input
          className={styles.fieldInput}
          value={p.letterSpacing || 'normal'}
          onChange={(e) => update({ letterSpacing: e.target.value })}
          placeholder="normal"
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
