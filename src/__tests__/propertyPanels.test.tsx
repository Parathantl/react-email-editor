import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithEditor } from './helpers/renderWithEditor';
import { TextProperties } from '../components/Properties/TextProperties';
import { ButtonProperties } from '../components/Properties/ButtonProperties';
import { DividerProperties } from '../components/Properties/DividerProperties';
import { SpacerProperties } from '../components/Properties/SpacerProperties';
import { createBlock, createSection } from '../utils/factory';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';
import type { EmailTemplate } from '../types';

function makeTemplate(blockType: any) {
  const section = createSection();
  const block = createBlock(blockType);
  section.columns[0].blocks.push(block);
  return {
    template: {
      sections: [section],
      globalStyles: { ...DEFAULT_GLOBAL_STYLES },
      headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
    } as EmailTemplate,
    block,
    section,
  };
}

describe('TextProperties', () => {
  it('renders line height and padding fields', () => {
    const { template, block } = makeTemplate('text');
    renderWithEditor(<TextProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Line Height')).toBeTruthy();
    expect(screen.getByText('Padding')).toBeTruthy();
  });

  it('displays the hint text', () => {
    const { template, block } = makeTemplate('text');
    renderWithEditor(<TextProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText(/inline toolbar/i)).toBeTruthy();
  });
});

describe('ButtonProperties', () => {
  it('renders button text input', () => {
    const { template, block } = makeTemplate('button');
    renderWithEditor(<ButtonProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Button Text')).toBeTruthy();
  });

  it('renders color pickers', () => {
    const { template, block } = makeTemplate('button');
    renderWithEditor(<ButtonProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Background Color')).toBeTruthy();
    expect(screen.getByText('Text Color')).toBeTruthy();
  });

  it('renders alignment picker', () => {
    const { template, block } = makeTemplate('button');
    renderWithEditor(<ButtonProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Alignment')).toBeTruthy();
  });
});

describe('DividerProperties', () => {
  it('renders border style selector', () => {
    const { template, block } = makeTemplate('divider');
    renderWithEditor(<DividerProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Border Style')).toBeTruthy();
    expect(screen.getByText('Border Color')).toBeTruthy();
  });

  it('renders width field', () => {
    const { template, block } = makeTemplate('divider');
    renderWithEditor(<DividerProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Width')).toBeTruthy();
  });
});

describe('SpacerProperties', () => {
  it('renders height slider', () => {
    const { template, block } = makeTemplate('spacer');
    renderWithEditor(<SpacerProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Height')).toBeTruthy();
  });
});

describe('PropertyField integration', () => {
  it('button properties renders font family picker', () => {
    const { template, block } = makeTemplate('button');
    renderWithEditor(<ButtonProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Font Family')).toBeTruthy();
  });

  it('divider properties renders padding input', () => {
    const { template, block } = makeTemplate('divider');
    renderWithEditor(<DividerProperties block={block} />, { initialTemplate: template });
    expect(screen.getByText('Padding')).toBeTruthy();
  });
});
