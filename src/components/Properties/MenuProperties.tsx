import React, { useCallback } from 'react';
import type { Block, MenuItem } from '../../types';
import { narrowBlock } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { generateId } from '../../utils/id';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';
import blockStyles from '../../styles/blocks.module.css';

const HAMBURGER_OPTIONS = [
  { value: 'false', label: 'Off' }, { value: 'true', label: 'On' },
];

interface MenuPropertiesProps {
  block: Block;
}

export function MenuProperties({ block }: MenuPropertiesProps) {
  const update = useBlockUpdate(block.id);

  const updateItem = useCallback(
    (index: number, changes: Partial<MenuItem>) => {
      const items = [...block.properties.items];
      items[index] = { ...items[index], ...changes };
      update({ items });
    },
    [block.properties.items, update],
  );

  const addItem = useCallback(() => {
    const items = [...block.properties.items, { id: generateId('mi'), text: 'Link', href: '#' }];
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
      <PropertyField type="font" label="Font Family" value={p.fontFamily} onChange={(v) => update({ fontFamily: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="color" label="Text Color" value={p.color} onChange={(v) => update({ color: v })} />
      <PropertyField type="select" label="Hamburger Mode" value={p.hamburger ? 'true' : 'false'} onChange={(v) => update({ hamburger: v === 'true' })} options={HAMBURGER_OPTIONS} />
      {p.hamburger && (
        <PropertyField type="color" label="Icon Color" value={p.iconColor} onChange={(v) => update({ iconColor: v })} />
      )}
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <FieldSeparator />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Menu Items</label>
        <div className={blockStyles.menuItemsContainer}>
          {p.items.map((item: MenuItem, index: number) => (
            <div key={item.id ?? `mi-${index}`} className={blockStyles.menuItemEntry}>
              <div className={styles.fieldRow}>
                <input
                  className={styles.fieldInputFlex}
                  value={item.text}
                  onChange={(e) => updateItem(index, { text: e.target.value })}
                  placeholder="Label"
                />
                <button className={`ee-item-move-up ${styles.itemActionBtn}`} onClick={() => moveItem(index, -1)} disabled={index === 0} title="Move up">↑</button>
                <button className={`ee-item-move-down ${styles.itemActionBtn}`} onClick={() => moveItem(index, 1)} disabled={index === p.items.length - 1} title="Move down">↓</button>
                <button className={`ee-item-remove ${styles.itemActionBtnDanger}`} onClick={() => removeItem(index)} title="Remove">×</button>
              </div>
              <input
                className={styles.fieldInputStacked}
                value={item.href}
                onChange={(e) => updateItem(index, { href: e.target.value })}
                placeholder="URL"
              />
            </div>
          ))}
        </div>
        <button className={`ee-add-item ${styles.addItemBtn}`} onClick={addItem}>+ Add Item</button>
      </div>
    </div>
  );
}
