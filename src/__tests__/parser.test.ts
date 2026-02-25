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

  it('auto-calculates column widths when not specified', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column><mj-text>A</mj-text></mj-column>
            <mj-column><mj-text>B</mj-text></mj-column>
          </mj-section>
          <mj-section>
            <mj-column><mj-text>X</mj-text></mj-column>
            <mj-column><mj-text>Y</mj-text></mj-column>
            <mj-column><mj-text>Z</mj-text></mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    // 2-column section → 50% each
    expect(result.sections[0].columns[0].width).toBe('50%');
    expect(result.sections[0].columns[1].width).toBe('50%');
    // 3-column section → 33.33% each
    expect(result.sections[1].columns[0].width).toBe('33.33%');
    expect(result.sections[1].columns[1].width).toBe('33.33%');
    expect(result.sections[1].columns[2].width).toBe('33.33%');
  });

  it('preserves explicit column widths', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column width="33%"><mj-text>A</mj-text></mj-column>
            <mj-column width="67%"><mj-text>B</mj-text></mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    expect(result.sections[0].columns[0].width).toBe('33%');
    expect(result.sections[0].columns[1].width).toBe('67%');
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

  // ---- Round-trip block type preservation (heading, countdown, html, video) ----

  it('parses heading block from css-class marker', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="36px" color="#111" font-weight="bold" css-class="ee-block-heading ee-heading-h1"><h1>Welcome</h1></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('heading');
    expect(block.properties.level).toBe('h1');
    expect(block.properties.content).toBe('Welcome');
    expect(block.properties.fontSize).toBe('36px');
    expect(block.properties.fontWeight).toBe('bold');
  });

  it('auto-detects heading in mj-text without css-class marker', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="28px"><h2>Title Here</h2></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    // Heading heuristic: mj-text wrapping a single h1-h4 is detected as a heading block
    expect(block.type).toBe('heading');
    expect(block.properties.level).toBe('h2');
    expect(block.properties.content).toContain('Title Here');
  });

  it('parses html block from css-class marker', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text padding="15px" css-class="ee-block-html"><div>Custom HTML</div></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('html');
    expect(block.properties.content).toContain('Custom HTML');
  });

  it('parses countdown block from css-class and embedded JSON metadata', () => {
    const meta = JSON.stringify({
      targetDate: '2026-12-31T00:00',
      label: 'Sale ends',
      digitBackgroundColor: '#333',
      digitColor: '#fff',
      labelColor: '#666',
      fontSize: '24px',
    });
    const escapedMeta = meta.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text padding="10px 25px" align="center" css-class="ee-block-countdown"><!--ee-countdown:${escapedMeta}--><div>countdown html</div></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('countdown');
    expect(block.properties.targetDate).toBe('2026-12-31T00:00');
    expect(block.properties.label).toBe('Sale ends');
    expect(block.properties.digitBackgroundColor).toBe('#333');
    expect(block.properties.digitColor).toBe('#fff');
    expect(block.properties.labelColor).toBe('#666');
    expect(block.properties.fontSize).toBe('24px');
  });

  it('countdown round-trip preserves label with pipe characters', () => {
    const meta = JSON.stringify({
      targetDate: '2026-06-15T12:00',
      label: 'Sale | Limited Time | Hurry',
      digitBackgroundColor: '#000',
      digitColor: '#fff',
      labelColor: '#999',
      fontSize: '20px',
    });
    const escapedMeta = meta.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text padding="10px" css-class="ee-block-countdown"><!--ee-countdown:${escapedMeta}--><div>timer</div></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('countdown');
    expect(block.properties.label).toBe('Sale | Limited Time | Hurry');
  });

  it('parses video block from css-class marker on mj-image', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-image src="https://img.youtube.com/vi/abc123/hqdefault.jpg" href="https://www.youtube.com/watch?v=abc123" alt="Video" css-class="ee-block-video" />
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('video');
    expect(block.properties.src).toBe('https://www.youtube.com/watch?v=abc123');
    expect(block.properties.thumbnailUrl).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
  });

  it('parses video block from YouTube URL heuristic (no css-class)', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-image src="https://img.youtube.com/vi/xyz789/hqdefault.jpg" href="https://youtu.be/xyz789" alt="My Video" />
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('video');
    expect(block.properties.src).toBe('https://youtu.be/xyz789');
  });

  it('parses regular text block without heading promotion', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Just some <strong>text</strong></mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const result = parseMJML(mjml);
    const block = result.sections[0].columns[0].blocks[0];
    expect(block.type).toBe('text');
  });
});
