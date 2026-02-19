import { describe, it, expect } from 'vitest';
import { sanitizeHTML, escapeHTML, sanitizeStyle, isSafeURL } from '../utils/sanitize';

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

  it('sanitizes dangerous CSS in style attributes', () => {
    const input = '<p style="color: red; background: expression(alert(1))">Text</p>';
    const result = sanitizeHTML(input);
    expect(result).toContain('color: red');
    expect(result).not.toContain('expression');
  });

  it('strips url() with javascript scheme from styles', () => {
    const input = '<div style="background: url(javascript:alert(1))">Text</div>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('javascript');
    expect(result).not.toContain('url(');
  });

  it('strips disallowed CSS properties', () => {
    const input = '<span style="color: red; position: fixed; top: 0">Text</span>';
    const result = sanitizeHTML(input);
    expect(result).toContain('color: red');
    expect(result).not.toContain('position');
    expect(result).not.toContain('top');
  });

  it('allows safe inline styles', () => {
    const input = '<p style="color: #333; font-size: 16px; padding: 10px">Text</p>';
    const result = sanitizeHTML(input);
    expect(result).toContain('color: #333');
    expect(result).toContain('font-size: 16px');
    expect(result).toContain('padding: 10px');
  });
});

describe('sanitizeStyle', () => {
  it('allows safe CSS properties', () => {
    expect(sanitizeStyle('color: red; font-size: 14px')).toBe('color: red; font-size: 14px');
  });

  it('strips expression() values', () => {
    expect(sanitizeStyle('color: expression(alert(1))')).toBe('');
  });

  it('strips javascript: in url()', () => {
    expect(sanitizeStyle('background: url(javascript:alert(1))')).toBe('');
  });

  it('strips url() entirely from values', () => {
    expect(sanitizeStyle('background: url(https://evil.com/track.gif)')).toBe('');
  });

  it('strips disallowed properties like position', () => {
    expect(sanitizeStyle('position: fixed; color: blue')).toBe('color: blue');
  });

  it('returns empty string for fully dangerous input', () => {
    expect(sanitizeStyle('expression(alert(1))')).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizeStyle('')).toBe('');
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

describe('isSafeURL', () => {
  it('allows https URLs', () => {
    expect(isSafeURL('https://example.com')).toBe(true);
  });

  it('allows http URLs', () => {
    expect(isSafeURL('http://example.com')).toBe(true);
  });

  it('allows mailto URLs', () => {
    expect(isSafeURL('mailto:test@example.com')).toBe(true);
  });

  it('allows tel URLs', () => {
    expect(isSafeURL('tel:+1234567890')).toBe(true);
  });

  it('allows fragment URLs', () => {
    expect(isSafeURL('#section')).toBe(true);
  });

  it('allows relative paths', () => {
    expect(isSafeURL('/about')).toBe(true);
  });

  it('allows query-string URLs', () => {
    expect(isSafeURL('?param=value')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isSafeURL('javascript:alert(1)')).toBe(false);
  });

  it('rejects JavaScript: URLs (case insensitive)', () => {
    expect(isSafeURL('JavaScript:void(0)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: URLs', () => {
    expect(isSafeURL('vbscript:msgbox')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isSafeURL('')).toBe(false);
  });

  it('rejects whitespace-only strings', () => {
    expect(isSafeURL('   ')).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isSafeURL('  https://example.com  ')).toBe(true);
  });

  it('rejects javascript: with leading whitespace (trimmed)', () => {
    expect(isSafeURL('  javascript:alert(1)  ')).toBe(false);
  });
});
