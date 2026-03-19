import { useRef, useCallback } from 'react';
import { EmailEditor } from '../../src';
import type { EmailEditorRef, EmailTemplate, Variable } from '../../src/types';
import { createBase64Adapter } from '../adapters/base64-adapter';
import {CustomIcon, icons} from "./CustomIcons";

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

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    const mjml = editorRef.current.getMJML();
    const html = await editorRef.current.getHTML();
    console.log('Saved MJML:', mjml);
    console.log('Saved HTML:', html);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <EmailEditor
        ref={editorRef}
        variables={sampleVariables}
        imageUploadAdapter={imageAdapter}
        onChange={handleChange}
        onVariablesChange={handleVariablesChange}
        toolbarActions={
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#fff',
              background: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        }
        customIcons={{
            desktop: <CustomIcon svg={icons.desktop} />,
            mobile: <CustomIcon svg={icons.mobile} />,
            paletteText: <CustomIcon svg={icons.paletteText} />,
        }}
      />
    </div>
  );
};
