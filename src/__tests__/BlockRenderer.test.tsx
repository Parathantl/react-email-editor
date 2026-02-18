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
    renderWithEditor(<BlockRenderer block={block} />);
    // Default social block has facebook, twitter, instagram
    expect(screen.getByText('F')).toBeTruthy(); // Facebook initial
    expect(screen.getByText('T')).toBeTruthy(); // Twitter initial
    expect(screen.getByText('I')).toBeTruthy(); // Instagram initial
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
