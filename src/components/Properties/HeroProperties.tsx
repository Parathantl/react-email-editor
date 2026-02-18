import React, { useCallback } from 'react';
import type { Block, HeroBlockProperties } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import { LinkInput } from './controls/LinkInput';
import styles from '../../styles/properties.module.css';

interface HeroPropertiesProps {
  block: Block;
}

export function HeroProperties({ block }: HeroPropertiesProps) {
  const dispatch = useEditorDispatch();
  const p = block.properties as HeroBlockProperties;

  const update = useCallback(
    (props: Partial<HeroBlockProperties>) => {
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
        <label className={styles.fieldLabel}>Heading</label>
        <input
          className={styles.fieldInput}
          value={p.heading}
          onChange={(e) => update({ heading: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Subtext</label>
        <textarea
          className={styles.fieldTextarea}
          value={p.subtext}
          onChange={(e) => update({ subtext: e.target.value })}
          rows={3}
        />
      </div>
      <div className={styles.separator} />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Button Text</label>
        <input
          className={styles.fieldInput}
          value={p.buttonText}
          onChange={(e) => update({ buttonText: e.target.value })}
        />
      </div>
      <LinkInput
        label="Button Link"
        value={p.buttonHref}
        onChange={(buttonHref) => update({ buttonHref })}
      />
      <div className={styles.separator} />
      <ColorPicker
        label="Heading Color"
        value={p.headingColor}
        onChange={(headingColor) => update({ headingColor })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Heading Font Size</label>
        <input
          className={styles.fieldInput}
          value={p.headingFontSize}
          onChange={(e) => update({ headingFontSize: e.target.value })}
        />
      </div>
      <ColorPicker
        label="Subtext Color"
        value={p.subtextColor}
        onChange={(subtextColor) => update({ subtextColor })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Subtext Font Size</label>
        <input
          className={styles.fieldInput}
          value={p.subtextFontSize}
          onChange={(e) => update({ subtextFontSize: e.target.value })}
        />
      </div>
      <div className={styles.separator} />
      <ColorPicker
        label="Button Background"
        value={p.buttonBackgroundColor}
        onChange={(buttonBackgroundColor) => update({ buttonBackgroundColor })}
      />
      <ColorPicker
        label="Button Text Color"
        value={p.buttonColor}
        onChange={(buttonColor) => update({ buttonColor })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Button Border Radius</label>
        <input
          className={styles.fieldInput}
          value={p.buttonBorderRadius}
          onChange={(e) => update({ buttonBorderRadius: e.target.value })}
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
