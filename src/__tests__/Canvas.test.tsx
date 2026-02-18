import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Canvas } from '../components/Canvas/Canvas';
import { createSection, createBlock } from '../utils/factory';
import { renderWithEditor } from './helpers/renderWithEditor';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';

describe('Canvas', () => {
  it('renders the "Add Section" button', () => {
    renderWithEditor(<Canvas />);
    expect(screen.getByText('+ Add Section')).toBeTruthy();
  });

  it('renders with empty template', () => {
    renderWithEditor(<Canvas />);
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('renders sections from template', () => {
    const section = createSection();
    section.columns[0].blocks.push(createBlock('button'));

    renderWithEditor(<Canvas />, {
      initialTemplate: {
        sections: [section],
        globalStyles: { ...DEFAULT_GLOBAL_STYLES },
        headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
      },
    });

    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('renders multiple sections', () => {
    const section1 = createSection();
    section1.columns[0].blocks.push(createBlock('hero'));
    const section2 = createSection();
    section2.columns[0].blocks.push(createBlock('spacer'));

    renderWithEditor(<Canvas />, {
      initialTemplate: {
        sections: [section1, section2],
        globalStyles: { ...DEFAULT_GLOBAL_STYLES },
        headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
      },
    });

    expect(screen.getByText('Welcome to Our Newsletter')).toBeTruthy();
    expect(screen.getByText('20px')).toBeTruthy();
  });

  it('has proper ARIA labels', () => {
    renderWithEditor(<Canvas />);
    expect(screen.getByRole('main', { name: 'Email canvas' })).toBeTruthy();
    expect(screen.getByLabelText('Add new section')).toBeTruthy();
  });
});
