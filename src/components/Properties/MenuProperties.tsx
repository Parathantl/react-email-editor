import React, { useCallback } from 'react';
import type { Block, MenuBlockProperties, MenuItem } from '../../types';
import { narrowBlock } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import { AlignmentPicker } from './controls/AlignmentPicker';
import { FontPicker } from './controls/FontPicker';
import styles from '../../styles/properties.module.css';
import blockStyles from '../../styles/blocks.module.css';

interface MenuPropertiesProps {
  block: Block;
}

export function MenuProperties({ block }: MenuPropertiesProps) {
  const dispatch = useEditorDispatch();

  const update = useCallback(
    (props: Partial<MenuBlockProperties>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId: block.id, properties: props },
      });
    },
    [dispatch, block.id],
  );

  const updateItem = useCallback(
    (index: number, changes: Partial<MenuItem>) => {
      const items = [...block.properties.items];
      items[index] = { ...items[index], ...changes };
      update({ items });
    },
    [block.properties.items, update],
  );

  const addItem = useCallback(() => {
    const items = [...block.properties.items, { text: 'Link', href: '#' }];
    update({ items });
  }, [block.properties.items, update]);

  const removeItem = useCallback(
    (index: number) => {
      const items = block.properties.items.filter((_: any, i: number) => i !== index);
      update({ items });
    },
    [block.properties.items, update],
  );

  const moveItem = useCallback(
    (index: number, direction: -1 | 1) => {
      const items = [...block.properties.items];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      update({ items });
    },
    [block.properties.items, update],
  );

  if (!narrowBlock(block, 'menu')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
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
        label="Text Color"
        value={p.color}
        onChange={(color) => update({ color })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Hamburger Mode</label>
        <select
          className={styles.fieldSelect}
          value={p.hamburger ? 'true' : 'false'}
          onChange={(e) => update({ hamburger: e.target.value === 'true' })}
        >
          <option value="false">Off</option>
          <option value="true">On</option>
        </select>
      </div>
      {p.hamburger && (
        <ColorPicker
          label="Icon Color"
          value={p.iconColor}
          onChange={(iconColor) => update({ iconColor })}
        />
      )}
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
      <div className={styles.separator} />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Menu Items</label>
        <div className={blockStyles.menuItemsContainer}>
          {p.items.map((item: MenuItem, index: number) => (
            <div key={index} className={blockStyles.menuItemEntry}>
              <div className={styles.fieldRow}>
                <input
                  className={styles.fieldInput}
                  value={item.text}
                  onChange={(e) => updateItem(index, { text: e.target.value })}
                  placeholder="Label"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)' }}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === p.items.length - 1}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)' }}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeItem(index)}
                  style={{ padding: '4px 6px', cursor: 'pointer', border: '1px solid var(--ee-border-color)', borderRadius: '3px', background: 'var(--ee-bg-input)', color: 'var(--ee-color-danger)' }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              <input
                className={styles.fieldInput}
                value={item.href}
                onChange={(e) => updateItem(index, { href: e.target.value })}
                placeholder="URL"
                style={{ marginTop: 4 }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
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
          + Add Item
        </button>
      </div>
    </div>
  );
}
