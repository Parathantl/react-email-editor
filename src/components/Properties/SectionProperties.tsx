import React, { useCallback } from 'react';
import type { Section } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { ColorPicker } from './controls/ColorPicker';
import { PaddingInput } from './controls/PaddingInput';
import styles from '../../styles/properties.module.css';

interface SectionPropertiesProps {
  section: Section;
}

export function SectionProperties({ section }: SectionPropertiesProps) {
  const dispatch = useEditorDispatch();
  const { properties } = section;

  const update = useCallback(
    (props: Record<string, any>) => {
      dispatch({
        type: 'UPDATE_SECTION',
        payload: { sectionId: section.id, properties: props },
      });
    },
    [dispatch, section.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <ColorPicker
        label="Background Color"
        value={properties.backgroundColor}
        onChange={(color) => update({ backgroundColor: color })}
      />
      <PaddingInput
        label="Padding"
        value={properties.padding}
        onChange={(padding) => update({ padding })}
      />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Border Radius</label>
        <input
          className={styles.fieldInput}
          value={properties.borderRadius}
          onChange={(e) => update({ borderRadius: e.target.value })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <input
            type="checkbox"
            checked={properties.fullWidth || false}
            onChange={(e) => update({ fullWidth: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          Full Width
        </label>
      </div>
      <div className={styles.separator} />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Background Image URL</label>
        <input
          className={styles.fieldInput}
          value={properties.backgroundImage || ''}
          onChange={(e) => update({ backgroundImage: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Background Size</label>
        <select
          className={styles.fieldSelect}
          value={properties.backgroundSize || 'cover'}
          onChange={(e) => update({ backgroundSize: e.target.value })}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="auto">Auto</option>
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Background Repeat</label>
        <select
          className={styles.fieldSelect}
          value={properties.backgroundRepeat || 'no-repeat'}
          onChange={(e) => update({ backgroundRepeat: e.target.value })}
        >
          <option value="no-repeat">No Repeat</option>
          <option value="repeat">Repeat</option>
          <option value="repeat-x">Repeat X</option>
          <option value="repeat-y">Repeat Y</option>
        </select>
      </div>
    </div>
  );
}
