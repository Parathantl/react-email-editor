import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AddVariableForm } from '../components/Sidebar/AddVariableForm';
import { renderWithEditor } from './helpers/renderWithEditor';

describe('AddVariableForm', () => {
  it('shows the toggle button initially', () => {
    renderWithEditor(<AddVariableForm />);
    expect(screen.getByText('+ Add Variable')).toBeTruthy();
  });

  it('opens the form when toggle is clicked', () => {
    renderWithEditor(<AddVariableForm />);
    fireEvent.click(screen.getByText('+ Add Variable'));
    expect(screen.getByPlaceholderText('e.g. coupon_code')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Coupon Code')).toBeTruthy();
  });

  it('shows validation error when key is empty', () => {
    renderWithEditor(<AddVariableForm />);
    fireEvent.click(screen.getByText('+ Add Variable'));
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Variable key is required')).toBeTruthy();
  });

  it('shows validation error for duplicate key', () => {
    renderWithEditor(<AddVariableForm />, {
      variables: [{ key: 'test', label: 'Test', group: 'Custom' }],
    });
    fireEvent.click(screen.getByText('+ Add Variable'));
    const keyInput = screen.getByPlaceholderText('e.g. coupon_code');
    fireEvent.change(keyInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Variable "test" already exists')).toBeTruthy();
  });

  it('cancels and returns to toggle button', () => {
    renderWithEditor(<AddVariableForm />);
    fireEvent.click(screen.getByText('+ Add Variable'));
    expect(screen.getByText('Cancel')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('+ Add Variable')).toBeTruthy();
  });

  it('submits with valid data and closes form', () => {
    renderWithEditor(<AddVariableForm />);
    fireEvent.click(screen.getByText('+ Add Variable'));

    const keyInput = screen.getByPlaceholderText('e.g. coupon_code');
    fireEvent.change(keyInput, { target: { value: 'new_var' } });
    fireEvent.click(screen.getByText('Add'));

    // Form closes after successful submit
    expect(screen.getByText('+ Add Variable')).toBeTruthy();
  });
});
