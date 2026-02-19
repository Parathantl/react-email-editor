import React, { useCallback } from 'react';
import { BlockPalette } from './BlockPalette';
import { VariableList } from './VariableList';
import { AddVariableForm } from './AddVariableForm';
import { useEditorDispatch } from '../../context/EditorContext';
import { COLUMN_LAYOUTS } from '../../constants';
import type { BlockDefinition } from '../../constants';
import { createSection } from '../../utils/factory';
import styles from '../../styles/sidebar.module.css';

interface SidebarProps {
  blockDefinitions?: BlockDefinition[];
}

export function Sidebar({ blockDefinitions }: SidebarProps) {
  const dispatch = useEditorDispatch();

  const handleAddSection = useCallback(
    (widths: string[]) => {
      dispatch({ type: 'ADD_SECTION', payload: { section: createSection(widths) } });
    },
    [dispatch],
  );

  return (
    <div className={`ee-sidebar ${styles.sidebar}`}>
      <h3 className={`ee-sidebar-title ${styles.sectionTitle}`}>Variables</h3>
      <VariableList />
      <div className={styles.addVariableSection}>
        <AddVariableForm />
      </div>

      <h3 className={`ee-sidebar-title ${styles.sectionTitle}`}>Blocks</h3>
      <BlockPalette blockDefinitions={blockDefinitions} />

      <h3 className={`ee-sidebar-title ${styles.sectionTitle}`}>Layouts</h3>
      <div className={`ee-layout-section ${styles.layoutSection}`}>
        {COLUMN_LAYOUTS.map((layout) => (
          <div
            key={layout.label}
            className={`ee-layout-option ${styles.layoutOption}`}
            onClick={() => handleAddSection(layout.widths)}
          >
            <div className={`ee-layout-preview ${styles.layoutPreview}`}>
              {layout.widths.map((w, i) => (
                <div
                  key={i}
                  className={`ee-layout-column ${styles.layoutColumn}`}
                  style={{ width: w }}
                />
              ))}
            </div>
            <span className={`ee-layout-label ${styles.layoutLabel}`}>{layout.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
