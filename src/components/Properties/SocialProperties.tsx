import React, { useCallback } from 'react';
import type { Block, SocialBlockProperties, SocialElement } from '../../types';
import { narrowBlock } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import styles from '../../styles/properties.module.css';
import blockStyles from '../../styles/blocks.module.css';

interface SocialPropertiesProps {
  block: Block;
}

export function SocialProperties({ block }: SocialPropertiesProps) {
  const dispatch = useEditorDispatch();

  const update = useCallback(
    (props: Partial<SocialBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  const updateElement = useCallback(
    (index: number, changes: Partial<SocialElement>) => {
      const elements = [...block.properties.elements];
      elements[index] = { ...elements[index], ...changes };
      update({ elements });
    },
    [block.properties.elements, update],
  );

  const addElement = useCallback(() => {
    const elements = [...block.properties.elements, { name: 'web', href: '#' }];
    update({ elements });
  }, [block.properties.elements, update]);

  const removeElement = useCallback(
    (index: number) => {
      const elements = block.properties.elements.filter((_: any, i: number) => i !== index);
      update({ elements });
    },
    [block.properties.elements, update],
  );

  const moveElement = useCallback(
    (index: number, direction: -1 | 1) => {
      const elements = [...block.properties.elements];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= elements.length) return;
      [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
      update({ elements });
    },
    [block.properties.elements, update],
  );

  if (!narrowBlock(block, 'social')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Mode</label>
        <select
          className={styles.fieldSelect}
          value={p.mode}
          onChange={(e) => update({ mode: e.target.value as 'horizontal' | 'vertical' })}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      <AlignmentPicker
        label="Alignment"
        value={p.align}
        onChange={(align) => update({ align: align as 'left' | 'center' | 'right' })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Icon Size</label>
        <input
          className={styles.fieldInput}
          value={p.iconSize}
          onChange={(e) => update({ iconSize: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Icon Padding</label>
        <input
          className={styles.fieldInput}
          value={p.iconPadding}
          onChange={(e) => update({ iconPadding: e.target.value })}
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
      <ColorPicker
        label="Text Color"
        value={p.color}
        onChange={(color) => update({ color })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Font Size</label>
        <input
          className={styles.fieldInput}
          value={p.fontSize}
          onChange={(e) => update({ fontSize: e.target.value })}
        />
      </div>
      <PaddingInput
        label="Padding"
        value={p.padding}
        onChange={(padding) => update({ padding })}
      />
      <div className={styles.separator} />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Social Elements</label>
        <div className={blockStyles.socialElementsContainer}>
          {p.elements.map((element: SocialElement, index: number) => (
            <div key={index} className={blockStyles.socialElementItem}>
              <div className={styles.fieldRow}>
                <select
                  className={styles.fieldSelect}
                  value={element.name}
                  onChange={(e) => updateElement(index, { name: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                  <option value="github">GitHub</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="snapchat">Snapchat</option>
                  <option value="tiktok">TikTok</option>
                  <option value="web">Web</option>
                </select>
                <button
                  onClick={() => moveElement(index, -1)}
                  disabled={index === 0}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)' }}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveElement(index, 1)}
                  disabled={index === p.elements.length - 1}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)' }}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeElement(index)}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)', color: 'var(--ee-color-danger)' }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              <input
                className={styles.fieldInput}
                value={element.href}
                onChange={(e) => updateElement(index, { href: e.target.value })}
                placeholder="URL"
                style={{ marginTop: 4 }}
              />
              <input
                className={styles.fieldInput}
                value={element.content || ''}
                onChange={(e) => updateElement(index, { content: e.target.value })}
                placeholder="Label (optional)"
                style={{ marginTop: 4 }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={addElement}
          style={{
            marginTop: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            border: '1px solid var(--ee-border-color)',
            borderRadius: 'var(--ee-border-radius-sm)',
            background: 'var(--ee-bg-input)',
            fontSize: 'var(--ee-font-size-sm)',
            width: '100%',
          }}
        >
          + Add Element
        </button>
      </div>
    </div>
  );
}
