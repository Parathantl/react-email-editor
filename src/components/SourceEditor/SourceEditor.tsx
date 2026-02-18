import React, { useState, useCallback, useEffect } from 'react';
import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
import { generateMJML } from '../../mjml/generator';
import { parseMJML } from '../../mjml/parser';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 8, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ee-text-secondary)' }}>
          MJML Source
        </span>
        <button
          onClick={handleApply}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--ee-color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--ee-border-radius-sm)',
            cursor: 'pointer',
          }}
        >
          Apply Changes
        </button>
      </div>
      {error && (
        <div style={{ padding: 8, fontSize: 12, color: 'var(--ee-color-danger)', background: '#fef2f2', borderRadius: 4 }}>
          {error}
        </div>
      )}
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          lineHeight: 1.5,
          padding: 12,
          border: '1px solid var(--ee-border-color)',
          borderRadius: 'var(--ee-border-radius)',
          resize: 'none',
          outline: 'none',
          background: 'var(--ee-bg-input)',
          color: 'var(--ee-text-primary)',
          tabSize: 2,
        }}
      />
    </div>
  );
}
