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

  const handleVariablesChange = useCallback((customVars: Variable[]) => {
    console.log('Custom variables changed:', customVars);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <EmailEditor
        ref={editorRef}
        variables={sampleVariables}
        imageUploadAdapter={imageAdapter}
        onChange={handleChange}
        onVariablesChange={handleVariablesChange}
      />
    </div>
  );
};
