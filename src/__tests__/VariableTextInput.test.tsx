import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { VariableTextInput } from '../components/Properties/controls/VariableTextInput';
import { renderWithEditor } from './helpers/renderWithEditor';

/** Stateful wrapper so the input + onChange round-trip mirrors real usage. */
function Harness({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <VariableTextInput
      label="Button Text"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe('VariableTextInput', () => {
  it('renders the label and the variable-picker trigger', () => {
    renderWithEditor(<Harness />, { variables: [{ key: 'name', group: 'Test' }] });
    expect(screen.getByText('Button Text')).toBeTruthy();
    expect(screen.getByTitle('Insert variable')).toBeTruthy();
  });

  it('opens the popup listing available variables when the trigger is clicked', async () => {
    renderWithEditor(<Harness />, {
      variables: [
        { key: 'first_name', label: 'First Name', group: 'Test' },
        { key: 'last_name', label: 'Last Name', group: 'Test' },
      ],
    });
    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));
    await waitFor(() => {
      expect(screen.getByText('First Name')).toBeTruthy();
      expect(screen.getByText('Last Name')).toBeTruthy();
    });
  });

  it('inserts a variable token into the input when one is selected', async () => {
    const handleChange = vi.fn();
    renderWithEditor(<Harness initial="Hi " onChange={handleChange} />, {
      variables: [{ key: 'name', label: 'Name', group: 'Test' }],
    });
    // Focus the input so the caret lands at the end of "Hi ".
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const option = await screen.findByText('Name');
    // Use mouseDown — the popup commits on mousedown to avoid losing focus.
    fireEvent.mouseDown(option);

    expect(handleChange).toHaveBeenCalledWith('Hi {{ name }}');
  });

  it('creates a custom variable inline when none matches', async () => {
    const handleChange = vi.fn();
    renderWithEditor(<Harness initial="" onChange={handleChange} />, {
      variables: [],
    });
    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const search = await screen.findByPlaceholderText('Search variables…');
    fireEvent.change(search, { target: { value: 'coupon_code' } });

    const createBtn = await screen.findByText('Create variable');
    fireEvent.mouseDown(createBtn);

    expect(handleChange).toHaveBeenCalledWith('{{ coupon_code }}');
  });

  it('closes the popup on Escape', async () => {
    renderWithEditor(<Harness />, {
      variables: [{ key: 'name', label: 'Name', group: 'Test' }],
    });
    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const search = await screen.findByPlaceholderText('Search variables…');
    fireEvent.keyDown(search, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search variables…')).toBeNull();
    });
  });

  it('filters the variable list as the user types in the search', async () => {
    renderWithEditor(<Harness />, {
      variables: [
        { key: 'first_name', label: 'First Name', group: 'Test' },
        { key: 'last_name', label: 'Last Name', group: 'Test' },
      ],
    });
    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const search = await screen.findByPlaceholderText('Search variables…');
    fireEvent.change(search, { target: { value: 'last' } });

    await waitFor(() => {
      expect(screen.queryByText('First Name')).toBeNull();
      expect(screen.getByText('Last Name')).toBeTruthy();
    });
  });
});
