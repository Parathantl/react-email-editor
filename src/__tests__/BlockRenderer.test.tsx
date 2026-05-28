import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { BlockRenderer } from '../components/Canvas/BlockRenderer';
import { createBlock } from '../utils/factory';
import { renderWithEditor } from './helpers/renderWithEditor';

describe('BlockRenderer', () => {
  it('renders a button block', () => {
    const block = createBlock('button');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('renders plain button text without chip spans', () => {
    const block = createBlock('button');
    block.properties.text = 'Click me';
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    expect(container.querySelectorAll('.ee-variable-chip')).toHaveLength(0);
  });

  it('renders a single variable in button text as a chip', () => {
    const block = createBlock('button');
    block.properties.text = 'Hi {{ name }}';
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    const chips = container.querySelectorAll('.ee-variable-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toBe('{{ name }}');
  });

  it('renders multiple variables interleaved with text in a button', () => {
    const block = createBlock('button');
    block.properties.text = 'Hi {{ first }} {{ last }}!';
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    const chips = container.querySelectorAll('.ee-variable-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0].textContent).toBe('{{ first }}');
    expect(chips[1].textContent).toBe('{{ last }}');
    // The full button preview (outer) must still contain the literal suffix.
    const preview = container.querySelector('.ee-block-button');
    expect(preview?.textContent).toBe('Hi {{ first }} {{ last }}!');
  });

  it('does not crash on stray braces in button text', () => {
    const block = createBlock('button');
    // No well-formed pair: an opening `{{` without a matching `}}` should not
    // render a chip and must not throw at render time.
    const block2Text = 'Hi {{ incomplete';
    block.properties.text = block2Text;
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    expect(container.querySelectorAll('.ee-variable-chip')).toHaveLength(0);
    const preview = container.querySelector('.ee-block-button');
    expect(preview?.textContent).toBe(block2Text);
  });

  it('renders a divider block', () => {
    const block = createBlock('divider');
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    expect(container.querySelector('hr')).toBeTruthy();
  });

  it('renders a spacer block', () => {
    const block = createBlock('spacer');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('20px')).toBeTruthy();
  });

  it('renders a hero block', () => {
    const block = createBlock('hero');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Welcome to Our Newsletter')).toBeTruthy();
    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('renders a social block with elements', () => {
    const block = createBlock('social');
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    // Default social block has facebook, twitter, instagram — rendered as SVG icons
    const svgIcons = container.querySelectorAll('.ee-block-social svg');
    expect(svgIcons.length).toBe(3);
  });

  it('renders nothing for unknown block type', () => {
    const block = { id: 'test', type: 'unknown' as any, properties: {} };
    const { container } = renderWithEditor(<BlockRenderer block={block} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a menu block with items', () => {
    const block = createBlock('menu');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Contact')).toBeTruthy();
  });

  it('renders a countdown block', () => {
    const block = createBlock('countdown');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Sale ends in')).toBeTruthy();
    expect(screen.getByText('Days')).toBeTruthy();
    expect(screen.getByText('Hours')).toBeTruthy();
  });

  it('renders an HTML block placeholder when empty', () => {
    const block = createBlock('html');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Raw HTML Block')).toBeTruthy();
  });

  it('renders a video block placeholder when empty', () => {
    const block = createBlock('video');
    renderWithEditor(<BlockRenderer block={block} />);
    expect(screen.getByText('Video Block')).toBeTruthy();
  });
});
