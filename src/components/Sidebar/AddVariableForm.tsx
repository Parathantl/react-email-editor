import React, { useState, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import styles from '../../styles/sidebar.module.css';

export function AddVariableForm() {
  const { variables, addCustomVariable } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [sample, setSample] = useState('');
  const [group, setGroup] = useState('Custom');
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKey('');
    setLabel('');
    setSample('');
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

      if (!sample.trim()) {
        setError('Sample value is required');
        return;
      }

      addCustomVariable({
        key: trimmedKey,
        label: label.trim() || trimmedKey,
        sample: sample.trim(),
        group: group.trim() || 'Custom',
      });

      resetForm();
      setIsOpen(false);
    },
    [key, label, sample, group, variables, addCustomVariable, resetForm],
  );

  const handleCancel = useCallback(() => {
    resetForm();
    setIsOpen(false);
  }, [resetForm]);

  if (!isOpen) {
    return (
      <button
        className={styles.addVariableBtn}
        onClick={() => setIsOpen(true)}
      >
        + Add Variable
      </button>
    );
  }

  return (
    <form className={styles.addVariableForm} onSubmit={handleSubmit}>
      <div className={styles.addVariableField}>
        <label className={styles.addVariableLabel}>Key *</label>
        <input
          className={styles.addVariableInput}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          placeholder="e.g. coupon_code"
          autoFocus
        />
      </div>
      <div className={styles.addVariableField}>
        <label className={styles.addVariableLabel}>Label</label>
        <input
          className={styles.addVariableInput}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Coupon Code"
        />
      </div>
      <div className={styles.addVariableField}>
        <label className={styles.addVariableLabel}>Sample Value *</label>
        <input
          className={styles.addVariableInput}
          value={sample}
          onChange={(e) => {
            setSample(e.target.value);
            setError(null);
          }}
          placeholder="e.g. SAVE20"
        />
      </div>
      <div className={styles.addVariableField}>
        <label className={styles.addVariableLabel}>Group</label>
        <input
          className={styles.addVariableInput}
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Custom"
        />
      </div>
      {error && <div className={styles.addVariableError}>{error}</div>}
      <div className={styles.addVariableActions}>
        <button type="button" className={styles.addVariableCancelBtn} onClick={handleCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.addVariableSubmitBtn}>
          Add
        </button>
      </div>
    </form>
  );
}
