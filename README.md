# @parathantl/react-email-editor

[![npm version](https://img.shields.io/npm/v/@parathantl/react-email-editor.svg)](https://www.npmjs.com/package/@parathantl/react-email-editor)
[![license](https://img.shields.io/npm/l/@parathantl/react-email-editor.svg)](https://github.com/parathantl/react-email-editor/blob/main/LICENSE)

A visual drag-and-drop email template editor for React, powered by MJML. Build responsive HTML emails with a rich block-based editor, real-time preview, and full MJML round-trip support.

## Features

- 12 block types: Text, Heading, Button, Image, Video, Divider, Spacer, Social, HTML, Countdown, Menu, Hero
- Drag-and-drop block reordering and section management
- Rich text editing (TipTap) with formatting toolbar
- MJML generation, parsing, and HTML compilation
- Template variable support (`{{ variable }}` syntax)
- Built-in persistence with localStorage or custom adapters
- Responsive editor UI with collapsible panels
- Undo/redo history (50 steps)
- Export to MJML, HTML, and PDF
- Extensible via registry pattern (add custom block types)
- Full TypeScript support with strict mode
- CSS variables for easy theming

## Installation

```bash
npm install @parathantl/react-email-editor
```

**Peer dependencies:** React 18+, React DOM 18+

**Optional:** Install `mjml-browser` for HTML compilation (MJML to HTML conversion):

```bash
npm install mjml-browser
```

## Quick Start

```tsx
import { EmailEditor } from '@parathantl/react-email-editor';
import '@parathantl/react-email-editor/styles.css';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <EmailEditor
        onChange={(template) => console.log(template)}
        onSave={(mjml, html) => console.log(mjml, html)}
      />
    </div>
  );
}
```

## Persistence

Templates auto-save and restore when you provide a `persistenceKey`. Each key stores a separate template, so multiple editor instances can coexist.

### localStorage (default)

```tsx
<EmailEditor persistenceKey="campaign-123" />
```

### Custom Adapter (server, IndexedDB, etc.)

```tsx
import type { PersistenceAdapter } from '@parathantl/react-email-editor';

const serverAdapter: PersistenceAdapter = {
  save(key, template) {
    fetch(`/api/templates/${key}`, {
      method: 'PUT',
      body: JSON.stringify(template),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  load(key) {
    // Must be synchronous — preload data before rendering the editor
    return window.__PRELOADED_TEMPLATES__?.[key] ?? null;
  },
  remove(key) {
    fetch(`/api/templates/${key}`, { method: 'DELETE' });
  },
};

<EmailEditor persistenceKey="campaign-123" persistenceAdapter={serverAdapter} />
```

**Priority order:** persisted data > `initialTemplate` > `initialMJML`

## Loading MJML from Another Component

Use the ref API to control the editor from parent components:

```tsx
import { useRef } from 'react';
import { EmailEditor } from '@parathantl/react-email-editor';
import type { EmailEditorRef } from '@parathantl/react-email-editor';

function TemplateDesigner() {
  const editorRef = useRef<EmailEditorRef>(null);

  const loadFromServer = async () => {
    const res = await fetch('/api/templates/welcome');
    const mjml = await res.text();
    editorRef.current?.loadMJML(mjml);
  };

  const handleSave = async () => {
    const mjml = editorRef.current?.getMJML();
    const html = await editorRef.current?.getHTML();
    // Send to your API
  };

  return (
    <div>
      <button onClick={loadFromServer}>Load Template</button>
      <button onClick={handleSave}>Save</button>
      <EmailEditor ref={editorRef} persistenceKey="welcome" />
    </div>
  );
}
```

Or pass MJML at init time without a ref:

```tsx
<EmailEditor initialMJML={mjmlString} />
```

## Ref API

| Method | Returns | Description |
|--------|---------|-------------|
| `getMJML()` | `string` | Get current template as MJML |
| `getHTML()` | `Promise<string>` | Compile and get HTML output |
| `getJSON()` | `EmailTemplate` | Get template as JSON object |
| `loadMJML(source)` | `void` | Parse MJML and load into editor |
| `loadJSON(template)` | `void` | Load an EmailTemplate object |
| `insertBlock(type, sectionIdx?)` | `void` | Programmatically add a block |
| `getVariables()` | `string[]` | Extract `{{ variable }}` keys |
| `undo()` | `void` | Undo last action |
| `redo()` | `void` | Redo last undone action |
| `reset()` | `void` | Clear all content |
| `clearPersisted()` | `void` | Remove saved data for the current key |
| `exportPDF()` | `Promise<void>` | Generate PDF via print dialog |

## Props

| Prop | Type | Description |
|------|------|-------------|
| `initialTemplate` | `EmailTemplate` | Initial template object |
| `initialMJML` | `string` | Initial MJML string (parsed on mount) |
| `variables` | `Variable[]` | Template variables for `{{ }}` insertion |
| `imageUploadAdapter` | `ImageUploadAdapter` | Custom image upload handler |
| `onChange` | `(template: EmailTemplate) => void` | Called on every template change (debounced 150ms) |
| `onSave` | `(mjml: string, html: string) => void` | Called on Ctrl+S |
| `onReady` | `() => void` | Called once after editor mounts |
| `onVariablesChange` | `(customVariables: Variable[]) => void` | Called when user adds/removes custom variables |
| `fontFamilies` | `string[]` | Custom font options for the toolbar |
| `fontSizes` | `string[]` | Custom font size options |
| `persistenceKey` | `string` | Key for auto-save/restore (enables persistence) |
| `persistenceAdapter` | `PersistenceAdapter` | Custom storage adapter (defaults to localStorage) |
| `className` | `string` | CSS class for the outer wrapper |
| `style` | `CSSProperties` | Inline styles for the outer wrapper |

## Block Types

| Type | Description | MJML Output |
|------|-------------|-------------|
| `text` | Rich text with formatting | `<mj-text>` |
| `heading` | Heading (h1–h4) with level selector | `<mj-text><h2>...</h2></mj-text>` |
| `button` | Call-to-action button | `<mj-button>` |
| `image` | Image with optional link | `<mj-image>` |
| `video` | Video thumbnail with play overlay | `<mj-image>` (linked) |
| `divider` | Horizontal line | `<mj-divider>` |
| `spacer` | Vertical spacing | `<mj-spacer>` |
| `social` | Social media icon links | `<mj-social>` |
| `html` | Raw HTML content | `<mj-text>` |
| `countdown` | Live countdown timer with digit boxes | `<mj-text>` (HTML table) |
| `menu` | Navigation menu links | `<mj-navbar>` |
| `hero` | Heading + subtext + CTA button | `<mj-text>` (composite HTML) |

## Template Variables

Define variables and insert them into text blocks as `{{ variable_name }}`. Variables appear as insertable chips in the sidebar, grouped by category. Users can click or drag them into any text/heading block.

```tsx
<EmailEditor
  variables={[
    { key: 'first_name', sample: 'John', label: 'First Name', group: 'Contact' },
    { key: 'company', sample: 'Acme Inc', label: 'Company', group: 'Contact' },
    { key: 'unsubscribe_url', sample: '#', label: 'Unsubscribe URL', group: 'Links' },
  ]}
/>
```

| Variable Field | Required | Description |
|---------------|----------|-------------|
| `key` | Yes | The placeholder key used in `{{ key }}` syntax |
| `sample` | No | Sample value shown in previews and tooltips |
| `label` | No | Display label in the sidebar (defaults to `key`) |
| `group` | No | Group name for organizing variables in the sidebar |
| `icon` | No | Icon shown next to the variable chip |

### Retrieving used variables

Extract which variables are actually used in the current template:

```tsx
const keys = editorRef.current?.getVariables();
// ['first_name', 'unsubscribe_url']
```

### Listening for custom variable changes

Users can create custom variables at runtime via the sidebar. Use `onVariablesChange` to sync these back to your backend:

```tsx
<EmailEditor
  variables={backendVariables}
  onVariablesChange={(customVars) => {
    // customVars = variables created by the user in the editor
    saveToBackend(customVars);
  }}
/>
```

## Custom Fonts

Pass custom font families and sizes to the editor. These appear in the rich text toolbar dropdowns.

```tsx
<EmailEditor
  fontFamilies={[
    'Arial, sans-serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Inter, sans-serif',         // your custom web font
  ]}
  fontSizes={['12px', '14px', '16px', '18px', '20px', '24px', '32px']}
/>
```

If omitted, the editor falls back to built-in defaults (8 font families, 11 font sizes).

## Backend Integration

A complete example showing how to pass placeholders from your backend, save the template, and retrieve used variables:

```tsx
import { useRef, useEffect, useState } from 'react';
import { EmailEditor } from '@parathantl/react-email-editor';
import '@parathantl/react-email-editor/styles.css';
import type { EmailEditorRef, EmailTemplate, Variable } from '@parathantl/react-email-editor';

function TemplateEditor({ templateId }: { templateId: string }) {
  const editorRef = useRef<EmailEditorRef>(null);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [initialTemplate, setInitialTemplate] = useState<EmailTemplate | undefined>();

  // 1. Load variables and template from backend on mount
  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then((res) => res.json())
      .then((data) => {
        setVariables(data.variables);      // backend-defined placeholders
        setInitialTemplate(data.template); // saved template JSON
      });
  }, [templateId]);

  // 2. Save template + used variables to backend
  const handleSave = async (mjml: string, html: string) => {
    const usedVariables = editorRef.current?.getVariables(); // ['first_name', 'company']
    const templateJSON = editorRef.current?.getJSON();

    await fetch(`/api/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mjml,
        html,
        template: templateJSON,
        usedVariables,
      }),
    });
  };

  // 3. Sync user-created custom variables to backend
  const handleVariablesChange = (customVars: Variable[]) => {
    fetch(`/api/templates/${templateId}/variables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customVars),
    });
  };

  if (!initialTemplate) return <div>Loading...</div>;

  return (
    <EmailEditor
      ref={editorRef}
      initialTemplate={initialTemplate}
      variables={variables}
      onSave={handleSave}
      onVariablesChange={handleVariablesChange}
      onChange={(template) => {
        // Optional: auto-save on every change
        console.log('Template updated');
      }}
      fontFamilies={['Arial, sans-serif', 'Georgia, serif', 'Inter, sans-serif']}
    />
  );
}
```

### Data flow summary

```
Backend                          Editor                         Backend
  |                                |                              |
  |-- variables (props) --------> |                              |
  |-- initialTemplate (props) --> |                              |
  |                                |                              |
  |                                | -- onSave(mjml, html) -----> |
  |                                | -- ref.getVariables() -----> |  (used variable keys)
  |                                | -- ref.getJSON() ----------> |  (template structure)
  |                                | -- onVariablesChange() ----> |  (custom variables)
```

## Custom Block Types

Extend the editor with your own block types using the registry:

```tsx
import {
  registerBlockRenderer,
  registerBlockProperties,
  registerBlockGenerator,
} from '@parathantl/react-email-editor';

// Register a canvas renderer
registerBlockRenderer('my-block', MyBlockComponent);

// Register a properties panel
registerBlockProperties('my-block', MyBlockPropertiesPanel);

// Register an MJML generator
registerBlockGenerator('my-block', (block, indent) => {
  return `${indent}<mj-text>${block.properties.content}</mj-text>`;
});
```

## Theming

The editor uses CSS custom properties scoped under `--ee-*`. Override them to match your app:

```css
:root {
  --ee-color-primary: #8b5cf6;
  --ee-color-primary-hover: #7c3aed;
  --ee-bg-panel: #fafafa;
  --ee-border-radius: 8px;
  --ee-font-family: 'Inter', sans-serif;
}
```

See `src/styles/variables.css` for the full list of 70+ customizable tokens.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + S` | Save (triggers `onSave`) |
| `Escape` | Deselect block/section |
| `Delete` / `Backspace` | Remove selected block or section |

## Responsive Editor

The editor automatically adapts to smaller screens:

- **>= 1024px** — Full 3-panel layout (sidebar, canvas, properties)
- **< 1024px** — Panels collapse into toggleable overlays with toolbar buttons

## Browser Support

Supports all modern browsers (Chrome, Firefox, Safari, Edge). Requires React 18+.

## License

[MIT](LICENSE)
