import React, { useCallback } from 'react';
import type { Block, SocialElement } from '../../types';
import { narrowBlock } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { generateId } from '../../utils/id';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';
import blockStyles from '../../styles/blocks.module.css';

const MODE_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' },
];

interface SocialPropertiesProps {
  block: Block;
}

export function SocialProperties({ block }: SocialPropertiesProps) {
  const update = useBlockUpdate(block.id);

  const updateElement = useCallback(
    (index: number, changes: Partial<SocialElement>) => {
      const elements = [...block.properties.elements];
      elements[index] = { ...elements[index], ...changes };
      update({ elements });
    },
    [block.properties.elements, update],
  );

  const addElement = useCallback(() => {
    const elements = [...block.properties.elements, { id: generateId('se'), name: 'web', href: '#' }];
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
      <PropertyField type="select" label="Mode" value={p.mode} onChange={(v) => update({ mode: v })} options={MODE_OPTIONS} />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="text" label="Icon Size" value={p.iconSize} onChange={(v) => update({ iconSize: v })} />
      <PropertyField type="text" label="Icon Padding" value={p.iconPadding} onChange={(v) => update({ iconPadding: v })} />
      <PropertyField type="text" label="Border Radius" value={p.borderRadius} onChange={(v) => update({ borderRadius: v })} />
      <PropertyField type="color" label="Text Color" value={p.color} onChange={(v) => update({ color: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <FieldSeparator />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Social Elements</label>
        <div className={blockStyles.socialElementsContainer}>
          {p.elements.map((element: SocialElement, index: number) => (
            <div key={element.id ?? `se-${index}`} className={blockStyles.socialElementItem}>
              <div className={styles.fieldRow}>
                <select
                  className={`${styles.fieldSelect} ${styles.fieldInputFlex}`}
                  value={element.name}
                  onChange={(e) => updateElement(index, { name: e.target.value })}
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
                <button className={`ee-item-move-up ${styles.itemActionBtn}`} onClick={() => moveElement(index, -1)} disabled={index === 0} title="Move up">↑</button>
                <button className={`ee-item-move-down ${styles.itemActionBtn}`} onClick={() => moveElement(index, 1)} disabled={index === p.elements.length - 1} title="Move down">↓</button>
                <button className={`ee-item-remove ${styles.itemActionBtnDanger}`} onClick={() => removeElement(index)} title="Remove">×</button>
              </div>
              <input
                className={styles.fieldInputStacked}
                value={element.href}
                onChange={(e) => updateElement(index, { href: e.target.value })}
                placeholder="URL"
              />
              <input
                className={styles.fieldInputStacked}
                value={element.content || ''}
                onChange={(e) => updateElement(index, { content: e.target.value })}
                placeholder="Label (optional)"
              />
            </div>
          ))}
        </div>
        <button className={`ee-add-item ${styles.addItemBtn}`} onClick={addElement}>+ Add Element</button>
      </div>
    </div>
  );
}
