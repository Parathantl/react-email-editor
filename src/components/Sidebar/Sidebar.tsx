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
  customIcons?: Record<string, React.ReactNode>;
}

export function Sidebar({ blockDefinitions, customIcons }: SidebarProps) {
  const dispatch = useEditorDispatch();

  const handleAddSection = useCallback(
    (widths: string[]) => {
      dispatch({ type: 'ADD_SECTION', payload: { section: createSection(widths) } });
    },
    [dispatch],
  );

  return (
    <div className={`ee-sidebar ${styles['ee-sidebar']}`}>
      <h3 className={`ee-sidebar-title ${styles['ee-section-title']}`}>Variables</h3>
      <VariableList />
      <div className={styles['ee-add-variable-section']}>
        <AddVariableForm />
      </div>

      <h3 className={`ee-sidebar-title ${styles['ee-section-title']}`}>Blocks</h3>
      <BlockPalette blockDefinitions={blockDefinitions} customIcons={customIcons} />

      <h3 className={`ee-sidebar-title ${styles['ee-section-title']}`}>Layouts</h3>
      <div className={`ee-layout-section ${styles['ee-layout-section']}`}>
        {COLUMN_LAYOUTS.map((layout) => (
          <div
            key={layout.label}
            className={`ee-layout-option ${styles['ee-layout-option']}`}
            onClick={() => handleAddSection(layout.widths)}
          >
            <div className={`ee-layout-preview ${styles['ee-layout-preview']}`}>
              {layout.widths.map((w, i) => (
                <div
                  key={i}
                  className={`ee-layout-column ${styles['ee-layout-column']}`}
                  style={{ width: w }}
                />
              ))}
            </div>
            <span className={`ee-layout-label ${styles['ee-layout-label']}`}>{layout.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
