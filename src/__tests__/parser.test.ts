import { describe, it, expect } from 'vitest';
import { parseMJML } from '../mjml/parser';

describe('parseMJML', () => {
  it('parses a basic MJML template', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].columns).toHaveLength(1);
    expect(result.sections[0].columns[0].blocks).toHaveLength(1);
    expect(result.sections[0].columns[0].blocks[0].type).toBe('text');
  });

  it('handles HTML void elements (br, hr, img) without self-closing', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Line one<br>Line two<br>Line three</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(1);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('text');
    expect(block.properties.content).toContain('Line one');
    expect(block.properties.content).toContain('Line two');
  });

  it('handles void elements with attributes', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Before<br class="test">After</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections[0].columns[0].blocks[0].properties.content).toContain('After');
  });

  it('does not double-close already self-closed elements', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Before<br/>After</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections[0].columns[0].blocks[0].properties.content).toContain('After');
  });

  it('handles HTML entities like &nbsp;', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello&nbsp;World</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const content = result.sections[0].columns[0].blocks[0].properties.content;
    expect(content).toContain('Hello');
    expect(content).toContain('World');
  });

  it('converts <font> tags to <span style> for TipTap', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text><font color="#ffffff">White text</font></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const content = result.sections[0].columns[0].blocks[0].properties.content;
    expect(content).not.toContain('<font');
    expect(content).toContain('style="color: #ffffff"');
    expect(content).toContain('White text');
  });

  it('converts <font size> to span with font-size', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text><font size="4">Large text</font></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const content = result.sections[0].columns[0].blocks[0].properties.content;
    expect(content).not.toContain('<font');
    expect(content).toContain('font-size: 18px');
  });

  it('parses global styles from mj-body', () => {
    const mjml = `
      <mjml>
        <mj-body background-color="#ff0000" width="800px">
          <mj-section>
            <mj-column>
              <mj-text>Text</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.globalStyles.backgroundColor).toBe('#ff0000');
    expect(result.globalStyles.width).toBe(800);
  });

  it('parses multiple sections', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section><mj-column><mj-text>One</mj-text></mj-column></mj-section>
          <mj-section><mj-column><mj-text>Two</mj-text></mj-column></mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(2);
  });

  it('parses mj-hero with images as section with individual blocks', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-hero background-color="#272626" background-url="https://example.com/bg.jpg" padding="100px 0px 100px 0px">
            <mj-image src="https://example.com/logo.png" width="125px" padding="0px 0px 0px 0px" align="center"></mj-image>
            <mj-text align="center" padding="10px 25px 10px 25px">Hello from hero</mj-text>
            <mj-button href="https://example.com" background-color="#000000" color="#ffffff">Click</mj-button>
          </mj-hero>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(1);
    const section = result.sections[0];
    expect(section.properties.backgroundColor).toBe('#272626');
    expect(section.properties.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(section.properties.padding).toBe('100px 0px 100px 0px');
    expect(section.columns).toHaveLength(1);
    expect(section.columns[0].blocks).toHaveLength(3);
    expect(section.columns[0].blocks[0].type).toBe('image');
    expect(section.columns[0].blocks[1].type).toBe('text');
    expect(section.columns[0].blocks[2].type).toBe('button');
  });

  it('parses mj-hero without images as hero block', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-hero background-color="#272626" background-url="https://example.com/bg.jpg" padding="100px 0px 100px 0px">
            <mj-text align="center">Hello from hero</mj-text>
            <mj-button href="https://example.com" background-color="#000000" color="#ffffff">Click</mj-button>
          </mj-hero>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(1);
    const section = result.sections[0];
    expect(section.columns[0].blocks).toHaveLength(1);
    const hero = section.columns[0].blocks[0];
    expect(hero.type).toBe('hero');
    expect(hero.properties.backgroundColor).toBe('#272626');
    expect(hero.properties.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(hero.properties.heading).toBe('Hello from hero');
    expect(hero.properties.buttonText).toBe('Click');
    expect(hero.properties.buttonBackgroundColor).toBe('#000000');
  });

  it('parses mj-hero with no children as empty hero block', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-hero background-color="#ffffff" background-url="https://example.com/bg.jpg" padding="100px 0px"></mj-hero>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].columns[0].blocks).toHaveLength(1);
    const hero = result.sections[0].columns[0].blocks[0];
    expect(hero.type).toBe('hero');
    expect(hero.properties.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(hero.properties.backgroundColor).toBe('#ffffff');
    expect(hero.properties.heading).toBe('');
  });

  it('preserves order of mj-section and mj-hero elements', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section><mj-column><mj-text>Section 1</mj-text></mj-column></mj-section>
          <mj-hero background-url="https://example.com/bg.jpg" padding="50px 0px">
            <mj-text>Hero content</mj-text>
          </mj-hero>
          <mj-section><mj-column><mj-text>Section 2</mj-text></mj-column></mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].columns[0].blocks[0].properties.content).toContain('Section 1');
    const heroBlock = result.sections[1].columns[0].blocks[0];
    expect(heroBlock.type).toBe('hero');
    expect(heroBlock.properties.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(heroBlock.properties.heading).toBe('Hero content');
    expect(result.sections[2].columns[0].blocks[0].properties.content).toContain('Section 2');
  });

  it('parses mj-hero with heading and subtext', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-hero background-color="#333" padding="40px 0px">
            <mj-text align="center" font-size="32px" color="#ffffff"><h2>Big Title</h2></mj-text>
            <mj-text align="center" font-size="16px" color="#cccccc">Some description text</mj-text>
            <mj-button href="https://example.com" background-color="#ff0000">Sign Up</mj-button>
          </mj-hero>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const hero = result.sections[0].columns[0].blocks[0];
    expect(hero.type).toBe('hero');
    expect(hero.properties.heading).toBe('Big Title');
    expect(hero.properties.headingColor).toBe('#ffffff');
    expect(hero.properties.headingFontSize).toBe('32px');
    expect(hero.properties.subtext).toBe('Some description text');
    expect(hero.properties.subtextColor).toBe('#cccccc');
    expect(hero.properties.subtextFontSize).toBe('16px');
    expect(hero.properties.buttonText).toBe('Sign Up');
    expect(hero.properties.buttonBackgroundColor).toBe('#ff0000');
  });

  it('throws on invalid XML even after preprocessing', () => {
    const mjml = '<not-mjml><unclosed>';
    expect(() => parseMJML(mjml)).toThrow('Invalid MJML');
  });
});
