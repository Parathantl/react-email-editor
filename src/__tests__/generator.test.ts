import { describe, it, expect } from 'vitest';
import { generateMJML } from '../mjml/generator';
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
    expect(mjml).toContain('<p>Hello World</p>');
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
    expect(mjml).toContain('<table><tr><td>Custom</td></tr></table>');
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
});
