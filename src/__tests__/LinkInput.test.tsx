import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { LinkInput } from '../components/Properties/controls/LinkInput';
import { renderWithEditor } from './helpers/renderWithEditor';

function Harness({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <LinkInput
      label="Link URL"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe('LinkInput variable picker', () => {
  it('renders the trigger alongside the URL input', () => {
    renderWithEditor(<Harness />, { variables: [{ key: 'campaign', group: 'Test' }] });
    expect(screen.getByLabelText('Link URL')).toBeTruthy();
    expect(screen.getByTitle('Insert variable')).toBeTruthy();
  });

  it('inserts a variable at the caret in URL mode', async () => {
    const handleChange = vi.fn();
    renderWithEditor(
      <Harness initial="https://example.com/?ref=" onChange={handleChange} />,
      { variables: [{ key: 'campaign', label: 'Campaign', group: 'Test' }] },
    );
    const input = screen.getByLabelText('Link URL') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const option = await screen.findByText('Campaign');
    fireEvent.mouseDown(option);

    expect(handleChange).toHaveBeenLastCalledWith('https://example.com/?ref={{ campaign }}');
  });

  it('preserves the mailto: prefix when inserting into an email value', async () => {
    const handleChange = vi.fn();
    renderWithEditor(
      <Harness initial="mailto:" onChange={handleChange} />,
      { variables: [{ key: 'user_email', label: 'User Email', group: 'Test' }] },
    );
    // Switching to email mode strips the prefix from the input but keeps the
    // type. addPrefix then re-prepends mailto: when emitting onChange.
    const input = screen.getByLabelText('Link URL') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const option = await screen.findByText('User Email');
    fireEvent.mouseDown(option);

    expect(handleChange).toHaveBeenLastCalledWith('mailto:{{ user_email }}');
  });

  it('suppresses URL validation when the value contains a variable', () => {
    renderWithEditor(<Harness initial="{{ unsubscribe_url }}" />, {
      variables: [{ key: 'unsubscribe_url', group: 'Test' }],
    });
    // Without the {{ guard this raw value would trip "URL should start with https://".
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('still shows validation for non-variable invalid URLs', () => {
    renderWithEditor(<Harness initial="ftp://invalid" />);
    expect(screen.getByRole('alert').textContent).toMatch(/https/);
  });

  it('replaces a lone default "#" placeholder instead of appending', async () => {
    const handleChange = vi.fn();
    renderWithEditor(<Harness initial="#" onChange={handleChange} />, {
      variables: [{ key: 'first_name', label: 'First Name', group: 'Test' }],
    });
    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));
    const option = await screen.findByText('First Name');
    fireEvent.mouseDown(option);
    // Without the special-case, this would be '#{{ first_name }}'.
    expect(handleChange).toHaveBeenLastCalledWith('{{ first_name }}');
  });

  it('keeps a typed "#anchor" intact when inserting (only the lone "#" is special)', async () => {
    const handleChange = vi.fn();
    renderWithEditor(<Harness initial="#section" onChange={handleChange} />, {
      variables: [{ key: 'id', label: 'ID', group: 'Test' }],
    });
    const input = screen.getByLabelText('Link URL') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));
    const option = await screen.findByText('ID');
    fireEvent.mouseDown(option);
    expect(handleChange).toHaveBeenLastCalledWith('#section{{ id }}');
  });

  it('creates a custom variable inline and inserts it', async () => {
    const handleChange = vi.fn();
    renderWithEditor(<Harness initial="" onChange={handleChange} />, { variables: [] });

    fireEvent.mouseDown(screen.getByTitle('Insert variable'));
    fireEvent.click(screen.getByTitle('Insert variable'));

    const search = await screen.findByPlaceholderText('Search variables…');
    fireEvent.change(search, { target: { value: 'tracking_id' } });

    const createBtn = await screen.findByText('Create variable');
    fireEvent.mouseDown(createBtn);

    expect(handleChange).toHaveBeenLastCalledWith('{{ tracking_id }}');
  });
});
