import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PropertiesPanel } from '../components/Properties/PropertiesPanel';
import { renderWithEditor } from './helpers/renderWithEditor';

describe('PropertiesPanel', () => {
  it('renders Email Settings when nothing is selected', () => {
    renderWithEditor(<PropertiesPanel />);
    expect(screen.getByText('Email Settings')).toBeTruthy();
  });

  it('renders the head metadata properties by default', () => {
    renderWithEditor(<PropertiesPanel />);
    // HeadMetadataProperties should be rendered
    expect(screen.getByText('Email Settings')).toBeTruthy();
  });
});
