import React, { useRef, useCallback } from 'react';
import { EmailEditor } from '../../src';
import type { EmailEditorRef, EmailTemplate, Variable } from '../../src/types';
import { createBase64Adapter } from '../adapters/base64-adapter';

const imageAdapter = createBase64Adapter();

const sampleVariables: Variable[] = [
  { key: 'first_name', sample: 'John', label: 'First Name', group: 'Contact' },
  { key: 'last_name', sample: 'Doe', label: 'Last Name', group: 'Contact' },
  { key: 'email', sample: 'john@example.com', label: 'Email', group: 'Contact' },
  { key: 'company_name', sample: 'Acme Inc', label: 'Company', group: 'Organization' },
  { key: 'unsubscribe_url', sample: '#', label: 'Unsubscribe URL', group: 'Links' },
];

export default function App() {
  const editorRef = useRef<EmailEditorRef>(null);

  const handleChange = useCallback((template: EmailTemplate) => {
    console.log('Template changed:', template);
  }, []);

  const handleGetMJML = useCallback(() => {
    if (editorRef.current) {
      const mjml = editorRef.current.getMJML();
      console.log('MJML output:', mjml);
    }
  }, []);

  const handleGetHTML = useCallback(async () => {
    if (editorRef.current) {
      const html = await editorRef.current.getHTML();
      console.log('HTML output:', html);
    }
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={handleGetMJML}>Log MJML</button>
        <button onClick={handleGetHTML}>Log HTML</button>
        <button onClick={() => editorRef.current?.undo()}>Undo</button>
        <button onClick={() => editorRef.current?.redo()}>Redo</button>
        <button onClick={() => editorRef.current?.reset()}>Reset</button>
      </div>
      <EmailEditor
        ref={editorRef}
        variables={sampleVariables}
        imageUploadAdapter={imageAdapter}
        onChange={handleChange}
        style={{ flex: 1 }}
      />
    </div>
  );
}
