import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { EditorProvider } from '../../context/EditorContext';
import type { EmailTemplate, Variable, ImageUploadAdapter } from '../../types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../../constants';

interface EditorWrapperOptions {
  initialTemplate?: EmailTemplate;
  variables?: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
}

const DEFAULT_TEMPLATE: EmailTemplate = {
  sections: [],
  globalStyles: { ...DEFAULT_GLOBAL_STYLES },
  headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
};

export function renderWithEditor(
  ui: React.ReactElement,
  options?: EditorWrapperOptions & Omit<RenderOptions, 'wrapper'>,
) {
  const {
    initialTemplate = DEFAULT_TEMPLATE,
    variables = [],
    imageUploadAdapter,
    ...renderOptions
  } = options ?? {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <EditorProvider
        initialTemplate={initialTemplate}
        variables={variables}
        imageUploadAdapter={imageUploadAdapter}
      >
        {children}
      </EditorProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
