import { describe, it, expect } from 'vitest';
import { sanitizeHTML, escapeHTML } from '../utils/sanitize';

describe('sanitizeHTML', () => {
  it('allows basic formatting tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script');
    // Text content is preserved (safe) but the dangerous tag is removed
    expect(result).toContain('Hello');
  });

  it('strips event handler attributes', () => {
    const input = '<p onclick="alert(1)">Click</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click');
  });

  it('sanitizes javascript: URLs in hrefs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href="#"');
  });

  it('allows safe links', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).toContain('href="https://example.com"');
  });

  it('allows images', () => {
    const input = '<img src="https://example.com/img.png" alt="test" />';
    const result = sanitizeHTML(input);
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="test"');
  });

  it('strips iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<iframe');
  });

  it('strips style tags', () => {
    const input = '<style>body{display:none}</style><p>Text</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<style');
    expect(result).toContain('Text');
  });

  it('allows table elements', () => {
    const input = '<table><tr><td>Cell</td></tr></table>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<td>Cell</td>');
  });

  it('allows heading tags', () => {
    const input = '<h1>Title</h1><h2>Subtitle</h2>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<h2>Subtitle</h2>');
  });

  it('strips data attributes', () => {
    const input = '<p data-evil="payload">Text</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('data-evil');
    expect(result).toContain('Text');
  });
});

describe('escapeHTML', () => {
  it('escapes angle brackets', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('handles empty string', () => {
    expect(escapeHTML('')).toBe('');
  });

  it('handles normal text', () => {
    expect(escapeHTML('Hello World')).toBe('Hello World');
  });
});
