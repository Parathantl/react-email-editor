import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { VariableList } from '../components/Sidebar/VariableList';
import { renderWithEditor } from './helpers/renderWithEditor';
import type { Variable } from '../types';

describe('VariableList', () => {
  it('shows empty state when no variables', () => {
    renderWithEditor(<VariableList />);
    expect(screen.getByText('No variables yet. Add one below.')).toBeTruthy();
  });

  it('renders variable chips', () => {
    const variables: Variable[] = [
      { key: 'first_name', label: 'First Name', group: 'Contact' },
      { key: 'email', label: 'Email', group: 'Contact' },
    ];
    renderWithEditor(<VariableList />, { variables });
    expect(screen.getByText('First Name')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('groups variables by group name', () => {
    const variables: Variable[] = [
      { key: 'first_name', label: 'First Name', group: 'Contact' },
      { key: 'company', label: 'Company', group: 'Business' },
    ];
    renderWithEditor(<VariableList />, { variables });
    expect(screen.getByText('Contact')).toBeTruthy();
    expect(screen.getByText('Business')).toBeTruthy();
  });

  it('shows hint text when variables exist', () => {
    const variables: Variable[] = [
      { key: 'name', label: 'Name', group: 'User' },
    ];
    renderWithEditor(<VariableList />, { variables });
    expect(screen.getByText('Click to insert at cursor, or drag into text.')).toBeTruthy();
  });

  it('renders variable with icon', () => {
    const variables: Variable[] = [
      { key: 'email', label: 'Email', group: 'Contact', icon: '@' },
    ];
    renderWithEditor(<VariableList />, { variables });
    expect(screen.getByText('@')).toBeTruthy();
  });

  it('falls back to key when label is not provided', () => {
    const variables: Variable[] = [
      { key: 'user_id', group: 'System' },
    ];
    renderWithEditor(<VariableList />, { variables });
    expect(screen.getByText('user_id')).toBeTruthy();
  });
});
