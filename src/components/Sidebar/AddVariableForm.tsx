import React, { useState, useCallback } from 'react';
import { useEditorVariables } from '../../context/EditorContext';
import { useConfigContext } from '../../context/ConfigContext';
import styles from '../../styles/sidebar.module.css';

export function AddVariableForm() {
  const { variables, addCustomVariable } = useEditorVariables();
  const { variableFormConfig } = useConfigContext();
  const showLabelField = variableFormConfig?.showLabelField ?? false;
  const showGroupField = variableFormConfig?.showGroupField ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('Custom');
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKey('');
    setLabel('');
    setGroup('Custom');
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (!trimmedKey) {
        setError('Variable key is required');
        return;
      }

      if (variables.some((v) => v.key === trimmedKey)) {
        setError(`Variable "${trimmedKey}" already exists`);
        return;
      }

      addCustomVariable({
        key: trimmedKey,
        label: label.trim() || trimmedKey,
        group: group.trim() || 'Custom',
      });

      resetForm();
      setIsOpen(false);
    },
    [key, label, group, variables, addCustomVariable, resetForm],
  );

  const handleCancel = useCallback(() => {
    resetForm();
    setIsOpen(false);
  }, [resetForm]);

  if (!isOpen) {
    return (
      <button
        className={`ee-add-variable-btn ${styles['ee-add-variable-btn']}`}
        onClick={() => setIsOpen(true)}
      >
        + Add Variable
      </button>
    );
  }

  return (
    <form className={`ee-add-variable-form ${styles['ee-add-variable-form']}`} onSubmit={handleSubmit}>
      <div className={`ee-add-variable-field ${styles['ee-add-variable-field']}`}>
        <label className={`ee-add-variable-label ${styles['ee-add-variable-label']}`}>Key *</label>
        <input
          className={`ee-add-variable-input ${styles['ee-add-variable-input']}`}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          placeholder="e.g. coupon_code"
          autoFocus
        />
      </div>
      {showLabelField && (
        <div className={`ee-add-variable-field ${styles['ee-add-variable-field']}`}>
          <label className={`ee-add-variable-label ${styles['ee-add-variable-label']}`}>Label</label>
          <input
            className={`ee-add-variable-input ${styles['ee-add-variable-input']}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Coupon Code"
          />
        </div>
      )}
      {showGroupField && (
        <div className={`ee-add-variable-field ${styles['ee-add-variable-field']}`}>
          <label className={`ee-add-variable-label ${styles['ee-add-variable-label']}`}>Group</label>
          <input
            className={`ee-add-variable-input ${styles['ee-add-variable-input']}`}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Custom"
          />
        </div>
      )}
      {error && <div className={`ee-add-variable-error ${styles['ee-add-variable-error']}`}>{error}</div>}
      <div className={`ee-add-variable-actions ${styles['ee-add-variable-actions']}`}>
        <button type="button" className={`ee-add-variable-cancel ${styles['ee-add-variable-cancel-btn']}`} onClick={handleCancel}>
          Cancel
        </button>
        <button type="submit" className={`ee-add-variable-submit ${styles['ee-add-variable-submit-btn']}`}>
          Add
        </button>
      </div>
    </form>
  );
}
