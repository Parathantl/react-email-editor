import React, { useState, useCallback } from 'react';
import { useEditorVariables } from '../../context/EditorContext';
import styles from '../../styles/sidebar.module.css';

export function AddVariableForm() {
  const { variables, addCustomVariable } = useEditorVariables();
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
        className={`ee-add-variable-btn ${styles.addVariableBtn}`}
        onClick={() => setIsOpen(true)}
      >
        + Add Variable
      </button>
    );
  }

  return (
    <form className={`ee-add-variable-form ${styles.addVariableForm}`} onSubmit={handleSubmit}>
      <div className={`ee-add-variable-field ${styles.addVariableField}`}>
        <label className={`ee-add-variable-label ${styles.addVariableLabel}`}>Key *</label>
        <input
          className={`ee-add-variable-input ${styles.addVariableInput}`}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          placeholder="e.g. coupon_code"
          autoFocus
        />
      </div>
      <div className={`ee-add-variable-field ${styles.addVariableField}`}>
        <label className={`ee-add-variable-label ${styles.addVariableLabel}`}>Label</label>
        <input
          className={`ee-add-variable-input ${styles.addVariableInput}`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Coupon Code"
        />
      </div>
      <div className={`ee-add-variable-field ${styles.addVariableField}`}>
        <label className={`ee-add-variable-label ${styles.addVariableLabel}`}>Group</label>
        <input
          className={`ee-add-variable-input ${styles.addVariableInput}`}
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Custom"
        />
      </div>
      {error && <div className={`ee-add-variable-error ${styles.addVariableError}`}>{error}</div>}
      <div className={`ee-add-variable-actions ${styles.addVariableActions}`}>
        <button type="button" className={`ee-add-variable-cancel ${styles.addVariableCancelBtn}`} onClick={handleCancel}>
          Cancel
        </button>
        <button type="submit" className={`ee-add-variable-submit ${styles.addVariableSubmitBtn}`}>
          Add
        </button>
      </div>
    </form>
  );
}
