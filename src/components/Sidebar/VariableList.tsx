import React, { useCallback, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { groupVariables } from '../../utils/variables';
import type { Variable } from '../../types';
import styles from '../../styles/sidebar.module.css';

export function VariableList() {
  const { variables, customVariables, insertVariable, removeCustomVariable } = useEditor();
  const [flashKey, setFlashKey] = useState<string | null>(null);

  const customKeys = new Set(customVariables.map((v) => v.key));

  const handleChipClick = useCallback(
    (key: string) => {
      const inserted = insertVariable(key);
      if (inserted) {
        setFlashKey(key);
        setTimeout(() => setFlashKey(null), 400);
      }
    },
    [insertVariable],
  );

  const handleDelete = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeCustomVariable(key);
    },
    [removeCustomVariable],
  );

  if (variables.length === 0) {
    return (
      <div className={styles.variableList}>
        <p className={styles.variableHint}>
          No variables yet. Add one below.
        </p>
      </div>
    );
  }

  const grouped = groupVariables(variables);

  return (
    <div className={styles.variableList}>
      <p className={styles.variableHint}>
        Click to insert at cursor, or drag into text.
      </p>
      {Array.from(grouped.entries()).map(([group, vars]) => (
        <div key={group} className={styles.variableGroup}>
          <h4 className={styles.variableGroupTitle}>{group}</h4>
          <div className={styles.variableChips}>
            {vars.map((v) => (
              <span
                key={v.key}
                className={`${styles.variableChip} ${flashKey === v.key ? styles.variableChipInserted : ''} ${customKeys.has(v.key) ? styles.variableChipCustom : ''}`}
                title={`Click to insert • Sample: ${v.sample}${customKeys.has(v.key) ? ' • Custom variable' : ''}`}
                onClick={() => handleChipClick(v.key)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `{{ ${v.key} }}`);
                  e.dataTransfer.setData('application/x-variable-key', v.key);
                }}
              >
                {v.icon && <span className={styles.variableChipIcon}>{v.icon}</span>}
                {v.label ?? v.key}
                {customKeys.has(v.key) && (
                  <button
                    className={styles.variableChipDelete}
                    onClick={(e) => handleDelete(v.key, e)}
                    title="Remove variable"
                  >
                    x
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
