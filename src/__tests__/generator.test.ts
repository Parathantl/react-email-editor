import { describe, it, expect } from 'vitest';
import { generateMJML } from '../mjml/generator';
import { parseMJML } from '../mjml/parser';
import { compileMJMLToHTML } from '../mjml/compiler';
import type { EmailTemplate } from '../types';
import { createBlock, createSection } from '../utils/factory';

function makeTemplate(sections: any[] = []): EmailTemplate {
  return {
    sections,
    globalStyles: {
      backgroundColor: '#f4f4f4',
      width: 600,
      fontFamily: 'Arial, sans-serif',
    },
  };
}

describe('generateMJML', () => {
  it('generates valid MJML for empty template', () => {
    const mjml = generateMJML(makeTemplate());
    expect(mjml).toContain('<mjml>');
    expect(mjml).toContain('</mjml>');
    expect(mjml).toContain('<mj-body');
    expect(mjml).toContain('</mj-body>');
    expect(mjml).toContain('background-color="#f4f4f4"');
    expect(mjml).toContain('width="600px"');
  });

  it('generates mj-text for text blocks', () => {
    const section = createSection();
    const block = createBlock('text');
    block.properties.content = '<p>Hello World</p>';
    block.properties.fontSize = '16px';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('font-size="16px"');
    expect(mjml).toContain('Hello World</p>');
  });

  it('generates mj-button for button blocks', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.text = 'Click Here';
    block.properties.href = 'https://example.com';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-button');
    expect(mjml).toContain('href="https://example.com"');
    expect(mjml).toContain('Click Here</mj-button>');
  });

  it('generates mj-image for image blocks', () => {
    const section = createSection();
    const block = createBlock('image');
    block.properties.src = 'https://example.com/img.png';
    block.properties.alt = 'Test image';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('src="https://example.com/img.png"');
    expect(mjml).toContain('alt="Test image"');
  });

  it('generates mj-divider for divider blocks', () => {
    const section = createSection();
    section.columns[0].blocks.push(createBlock('divider'));

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-divider');
    expect(mjml).toContain('border-style="solid"');
  });

  it('generates mj-spacer for spacer blocks', () => {
    const section = createSection();
    section.columns[0].blocks.push(createBlock('spacer'));

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-spacer');
    expect(mjml).toContain('height="20px"');
  });

  it('generates mj-text for html blocks (wrapped in mj-text)', () => {
    const section = createSection();
    const block = createBlock('html');
    block.properties.content = '<table><tr><td>Custom</td></tr></table>';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-text');
    // sanitizeHTML normalizes table structure (adds tbody)
    expect(mjml).toContain('<table><tbody><tr><td>Custom</td></tr></tbody></table>');
    expect(mjml).toContain('css-class="ee-block-html"');
  });

  it('generates mj-image for video blocks (thumbnail linked to video)', () => {
    const section = createSection();
    const block = createBlock('video');
    block.properties.src = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    block.properties.thumbnailUrl = 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(mjml).toContain('src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
  });

  it('generates mj-text with heading tag for heading blocks', () => {
    const section = createSection();
    const block = createBlock('heading');
    block.properties.content = 'My Heading';
    block.properties.level = 'h1';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('<h1>My Heading</h1>');
  });

  it('generates multi-column layouts', () => {
    const section = createSection(['50%', '50%']);
    section.columns[0].blocks.push(createBlock('text'));
    section.columns[1].blocks.push(createBlock('button'));

    const mjml = generateMJML(makeTemplate([section]));
    const columnMatches = mjml.match(/<mj-column/g);
    expect(columnMatches).toHaveLength(2);
    expect(mjml).toContain('width="50%"');
  });

  it('includes section background image attributes', () => {
    const section = createSection();
    section.properties.backgroundImage = 'https://example.com/bg.jpg';
    section.properties.backgroundSize = 'cover';
    section.properties.backgroundRepeat = 'no-repeat';

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('background-url="https://example.com/bg.jpg"');
    expect(mjml).toContain('background-size="cover"');
    expect(mjml).toContain('background-repeat="no-repeat"');
  });

  it('includes head metadata', () => {
    const template = makeTemplate();
    template.headMetadata = {
      title: 'My Email',
      previewText: 'Preview here',
      headStyles: ['.custom { color: red; }'],
    };

    const mjml = generateMJML(template);
    expect(mjml).toContain('<mj-title>My Email</mj-title>');
    expect(mjml).toContain('<mj-preview>Preview here</mj-preview>');
    expect(mjml).toContain('.custom { color: red; }');
  });

  it('escapes HTML in button text', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.text = 'Click <here>';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('Click &lt;here&gt;');
  });

  it('escapes attribute values', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = 'https://example.com?a=1&b=2';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('href="https://example.com?a=1&amp;b=2"');
  });

  it('escapes single quotes in attribute values', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = "https://example.com?q=it's";
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('href="https://example.com?q=it&#39;s"');
  });

  it('replaces javascript: URL with # in button href', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.text = 'Click';
    block.properties.href = 'javascript:alert(1)';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).not.toContain('javascript:');
    expect(mjml).toContain('href="#"');
  });

  it('replaces data: URL with # in image href', () => {
    const section = createSection();
    const block = createBlock('image');
    block.properties.src = 'https://example.com/img.png';
    block.properties.href = 'data:text/html,<script>alert(1)</script>';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).not.toContain('data:text/html');
    expect(mjml).toContain('href="#"');
  });

  it('replaces data: URL with # in image src', () => {
    const section = createSection();
    const block = createBlock('image');
    block.properties.src = 'data:image/svg+xml,<svg onload="alert(1)">';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).not.toContain('data:image');
    expect(mjml).toContain('src="#"');
  });

  it('preserves a bare variable as button href so mustache can substitute it', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = '{{ unsubscribe_url }}';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('href="{{ unsubscribe_url }}"');
    expect(mjml).not.toContain('href="#"');
  });

  it('preserves a variable embedded after a safe URL prefix in href', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = 'https://example.com/?ref={{ campaign_id }}';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    // The `&` in encoded form is not relevant here — there's no `&` in this href.
    expect(mjml).toContain('href="https://example.com/?ref={{ campaign_id }}"');
  });

  it('preserves a variable inside mailto: href', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = 'mailto:{{ user_email }}';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('href="mailto:{{ user_email }}"');
  });

  it('still rewrites dangerous schemes to # even when followed by a variable', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.href = 'javascript:alert({{ x }})';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).not.toContain('javascript:');
    expect(mjml).toContain('href="#"');
  });

  it('preserves variable placeholders in button text', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.text = 'Hi {{ customer_name }}, click here';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    // escapeHTML must not mangle {{ }} markers — downstream templating
    // engines need them intact to substitute at send time.
    expect(mjml).toContain('Hi {{ customer_name }}, click here</mj-button>');
  });

  it('preserves safe https URLs in button href', () => {
    const section = createSection();
    const block = createBlock('button');
    block.properties.text = 'Click';
    block.properties.href = 'https://safe.example.com';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('href="https://safe.example.com"');
  });

  it('strips variable chips using data-variable-key attribute', () => {
    const section = createSection();
    const block = createBlock('text');
    block.properties.content = '<p>Hello <span class="ee-variable-chip" data-variable-key="name" contenteditable="false">{{ name }}</span></p>';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('Hello {{ name }}');
    expect(mjml).not.toContain('ee-variable-chip');
  });

  it('strips variable chips even with nested HTML inside span', () => {
    const section = createSection();
    const block = createBlock('text');
    block.properties.content = '<p>Hi <span class="ee-variable-chip" data-variable-key="user" contenteditable="false"><em>{{ user }}</em></span>!</p>';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('Hi {{ user }}!');
    expect(mjml).not.toContain('ee-variable-chip');
  });

  it('generates countdown with JSON metadata (not pipe-delimited)', () => {
    const section = createSection();
    const block = createBlock('countdown');
    block.properties.label = 'Sale | Limited Time';
    block.properties.targetDate = '2026-12-31T00:00';
    section.columns[0].blocks.push(block);

    const mjml = generateMJML(makeTemplate([section]));
    expect(mjml).toContain('css-class="ee-block-countdown"');
    expect(mjml).toContain('<!--ee-countdown:');
    // Should contain JSON (not pipe-delimited)
    expect(mjml).toContain('Sale | Limited Time');
  });

  describe('paragraphSpacing', () => {
    it('applies margin-bottom to non-last top-level paragraphs when set', () => {
      const section = createSection();
      const block = createBlock('text');
      block.properties.content = '<p>First</p><p>Second</p><p>Third</p>';
      block.properties.paragraphSpacing = '12px';
      section.columns[0].blocks.push(block);

      const mjml = generateMJML(makeTemplate([section]));
      const first = mjml.match(/<p[^>]*>First<\/p>/)?.[0] ?? '';
      const second = mjml.match(/<p[^>]*>Second<\/p>/)?.[0] ?? '';
      const third = mjml.match(/<p[^>]*>Third<\/p>/)?.[0] ?? '';

      expect(first).toContain('margin:0 0 12px 0');
      expect(second).toContain('margin:0 0 12px 0');
      expect(third).toContain('margin:0');
      expect(third).not.toContain('12px');
    });

    it('falls back to margin:0 everywhere when paragraphSpacing is 0 or unset', () => {
      const section = createSection();
      const block = createBlock('text');
      block.properties.content = '<p>A</p><p>B</p>';
      block.properties.paragraphSpacing = '0';
      section.columns[0].blocks.push(block);

      const mjml = generateMJML(makeTemplate([section]));
      const ps = mjml.match(/<p[^>]*>/g) ?? [];
      expect(ps.length).toBeGreaterThan(0);
      for (const tag of ps) {
        expect(tag).toContain('margin:0');
        expect(tag).not.toMatch(/margin:0 0 [^0]/);
      }
    });

    it('keeps nested block descendants at margin:0', () => {
      const section = createSection();
      const block = createBlock('text');
      block.properties.content = '<blockquote><p>quoted</p></blockquote><p>after</p>';
      block.properties.paragraphSpacing = '10px';
      section.columns[0].blocks.push(block);

      const mjml = generateMJML(makeTemplate([section]));
      const nestedP = mjml.match(/<p[^>]*>quoted<\/p>/)?.[0] ?? '';
      const blockquoteTag = mjml.match(/<blockquote[^>]*>/)?.[0] ?? '';

      expect(blockquoteTag).toContain('margin:0 0 10px 0');
      expect(nestedP).toContain('margin:0');
      expect(nestedP).not.toContain('10px');
    });
  });

  describe('hero block with background image', () => {
    const BG = 'https://example.com/bg.jpg';

    function heroSection(withBg: boolean) {
      const section = createSection();
      const block = createBlock('hero');
      block.properties.heading = 'Welcome';
      block.properties.padding = '40px 25px';
      if (withBg) block.properties.backgroundImage = BG;
      section.columns[0].blocks.push(block);
      return section;
    }

    function findHero(template: EmailTemplate): any {
      for (const s of template.sections)
        for (const c of s.columns)
          for (const b of c.blocks) if (b.type === 'hero') return b;
      return null;
    }

    it('renders a hero with a background image as an mj-section, not mj-hero', () => {
      // mj-hero collapses to a negative height and has only a weak Outlook fallback;
      // mj-section is the canonical background-image container.
      const mjml = generateMJML(makeTemplate([heroSection(true)]));
      expect(mjml).toContain('<mj-section');
      expect(mjml).not.toContain('<mj-hero');
      expect(mjml).toContain(`background-url="${BG}"`);
      expect(mjml).toContain('background-size="cover"');
      // Round-trip marker so the section parses back to a hero block.
      expect(mjml).toContain('css-class="ee-block-hero"');
    });

    it('keeps a hero without a background image as mj-hero', () => {
      const mjml = generateMJML(makeTemplate([heroSection(false)]));
      expect(mjml).toContain('<mj-hero');
    });

    it('compiles cleanly: bg url present, no negative height, no NaN', async () => {
      const mjml = generateMJML(makeTemplate([heroSection(true)]));
      const { html, errors } = await compileMJMLToHTML(mjml);
      expect(errors).toEqual([]);
      expect(html).toContain(BG);
      expect(html).not.toMatch(/height:\s*-\d/); // no collapsing negative height
      expect(html).not.toMatch(/height="-\d/);
      expect(html).not.toContain('NaN');
    });

    it('round-trips a hero background image through generate -> parse', () => {
      const mjml = generateMJML(makeTemplate([heroSection(true)]));
      const hero = findHero(parseMJML(mjml));
      expect(hero).not.toBeNull();
      expect(hero.type).toBe('hero');
      expect(hero.properties.backgroundImage).toBe(BG);
      expect(hero.properties.padding).toBe('40px 25px');
      expect(hero.properties.heading).toBe('Welcome');
    });
  });
});
