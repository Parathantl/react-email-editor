import React, { useCallback, useState } from 'react';
import { useEditorVariables } from '../../context/EditorContext';
import { groupVariables } from '../../utils/variables';
import styles from '../../styles/sidebar.module.css';

export function VariableList() {
  const { variables, customVariables, insertVariable, removeCustomVariable } = useEditorVariables();
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
      <div className={`ee-variable-list ${styles.variableList}`}>
        <p className={`ee-variable-hint ${styles.variableHint}`}>
          No variables yet. Add one below.
        </p>
      </div>
    );
  }

  const grouped = groupVariables(variables);

  return (
    <div className={`ee-variable-list ${styles.variableList}`}>
      <p className={`ee-variable-hint ${styles.variableHint}`}>
        Click to insert at cursor, or drag into text.
      </p>
      {Array.from(grouped.entries()).map(([group, vars]) => (
        <div key={group} className={`ee-variable-group ${styles.variableGroup}`}>
          <h4 className={`ee-variable-group-title ${styles.variableGroupTitle}`}>{group}</h4>
          <div className={`ee-variable-chips ${styles.variableChips}`}>
            {vars.map((v) => (
              <span
                key={v.key}
                className={`ee-variable-chip ${styles.variableChip} ${flashKey === v.key ? styles.variableChipInserted : ''} ${customKeys.has(v.key) ? styles.variableChipCustom : ''}`}
                title={`Click to insert${v.sample ? ` • Sample: ${v.sample}` : ''}${customKeys.has(v.key) ? ' • Custom variable' : ''}`}
                onClick={() => handleChipClick(v.key)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `{{ ${v.key} }}`);
                  e.dataTransfer.setData('application/x-variable-key', v.key);
                }}
              >
                {v.icon && <span className={`ee-variable-chip-icon ${styles.variableChipIcon}`}>{v.icon}</span>}
                {v.label ?? v.key}
                {customKeys.has(v.key) && (
                  <button
                    className={`ee-variable-chip-delete ${styles.variableChipDelete}`}
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
