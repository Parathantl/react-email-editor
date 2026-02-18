import React, { useCallback } from 'react';
import type { Block, ButtonBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import { FontPicker } from './controls/FontPicker';
import { LinkInput } from './controls/LinkInput';
import styles from '../../styles/properties.module.css';

interface ButtonPropertiesProps {
  block: Block;
}

export function ButtonProperties({ block }: ButtonPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties;

  const update = useCallback(
    (props: Partial<ButtonBlockProperties>) => {
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
        <label className={styles.fieldLabel}>Button Text</label>
        <input
          className={styles.fieldInput}
          value={p.text}
          onChange={(e) => update({ text: e.target.value })}
        />
      </div>
      <LinkInput
        label="Link URL"
        value={p.href}
        onChange={(href) => update({ href })}
      />
      <div className={styles.separator} />
      <ColorPicker
        label="Background Color"
        value={p.backgroundColor}
        onChange={(backgroundColor) => update({ backgroundColor })}
      />
      <ColorPicker
        label="Text Color"
        value={p.color}
        onChange={(color) => update({ color })}
      />
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
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Border Radius</label>
        <input
          className={styles.fieldInput}
          value={p.borderRadius}
          onChange={(e) => update({ borderRadius: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Width</label>
        <input
          className={styles.fieldInput}
          value={p.width}
          onChange={(e) => update({ width: e.target.value })}
          placeholder="auto"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Font Weight</label>
        <select
          className={styles.fieldSelect}
          value={p.fontWeight || 'normal'}
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
          onChange={(e) => update({ textTransform: e.target.value })}
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
        label="Outer Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
      <PaddingInput
        label="Inner Padding"
        value={p.innerPadding}
        onChange={(innerPadding) => update({ innerPadding })}
      />
    </div>
  );
}
