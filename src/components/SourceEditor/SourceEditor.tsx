import React, { useState, useCallback, useEffect } from 'react';
import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { parseMJML } from '../../mjml/parser';
import styles from '../../styles/source-editor.module.css';

export function SourceEditor() {
  const { template } = useTemplateContext();
  const dispatch = useEditorDispatch();
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSource(generateMJML(template));
  }, [template]);

  const handleApply = useCallback(() => {
    try {
      const template = parseMJML(source);
      dispatch({ type: 'SET_TEMPLATE', payload: template });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [source, dispatch]);

  return (
    <div className={`ee-source-editor ${styles.sourceEditor}`}>
      <div className={`ee-source-header ${styles.sourceHeader}`}>
        <span className={`ee-source-label ${styles.sourceLabel}`}>
          MJML Source
        </span>
        <button
          className={`ee-source-apply ${styles.sourceApply}`}
          onClick={handleApply}
        >
          Apply Changes
        </button>
      </div>
      {error && (
        <div className={`ee-source-error ${styles.sourceError}`}>
          {error}
        </div>
      )}
      <textarea
        className={`ee-source-textarea ${styles.sourceTextarea}`}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
