import React, { useCallback } from 'react';
import { BlockPalette } from './BlockPalette';
import { VariableList } from './VariableList';
import { AddVariableForm } from './AddVariableForm';
import { useEditor } from '../../context/EditorContext';
import { COLUMN_LAYOUTS } from '../../constants';
import { createSection } from '../../utils/factory';
import styles from '../../styles/sidebar.module.css';

export function Sidebar() {
  const { dispatch } = useEditor();

  const handleAddSection = useCallback(
    (widths: string[]) => {
      dispatch({ type: 'ADD_SECTION', payload: { section: createSection(widths) } });
    },
    [dispatch],
  );

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.sectionTitle}>Variables</h3>
      <VariableList />
      <div className={styles.addVariableSection}>
        <AddVariableForm />
      </div>

      <h3 className={styles.sectionTitle}>Blocks</h3>
      <BlockPalette />

      <h3 className={styles.sectionTitle}>Layouts</h3>
      <div className={styles.layoutSection}>
        {COLUMN_LAYOUTS.map((layout) => (
          <div
            key={layout.label}
            className={styles.layoutOption}
            onClick={() => handleAddSection(layout.widths)}
          >
            <div className={styles.layoutPreview}>
              {layout.widths.map((w, i) => (
                <div
                  key={i}
                  className={styles.layoutColumn}
                  style={{ width: w }}
                />
              ))}
            </div>
            <span className={styles.layoutLabel}>{layout.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
