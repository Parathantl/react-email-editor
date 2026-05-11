import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import { getExtensions } from '../tiptap/extensions';
import { parseMJML } from '../mjml/parser';
import { generateMJML } from '../mjml/generator';
import mjml2html from 'mjml-browser';

/**
 * Regression test: empty <p/> tags in imported MJML are used as vertical
 * spacers. Without help the canvas shows them (ProseMirror trailing-break)
 * but the compiled email preview collapses them to 0 height. The fix is
 * asymmetric: the generator injects <br> into empty <p> for the preview,
 * and the parser strips that <br> on re-import so round trips stay stable.
 */
describe('empty paragraph round-trip', () => {
  it('canvas and preview show the same number of blank lines', () => {
    const mjml = `<mjml>
  <mj-head>
    <mj-style>p, h1, h2, h3, h4, ul, ol, blockquote { margin: 0; } ul, ol { padding-left: 1.5em; }</mj-style>
  </mj-head>
  <mj-body width="600px">
    <mj-section>
      <mj-column width="100%">
        <mj-text font-family="Ubuntu, Helvetica, Arial, sans-serif" font-size="13px" color="#000000" line-height="160%" padding="10px 25px 10px 25px" align="left"><h3 style="margin:0"><strong>Heading</strong></h3><p style="margin:0"/><p style="margin:0">First paragraph.</p><p style="margin:0"/><p style="margin:0">Second paragraph.</p></mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

    const parsed = parseMJML(mjml);
    const block = parsed.sections[0].columns[0].blocks[0];
    // Parser strips inline margin from content — the generator re-applies it
    // (with or without paragraph-spacing) on export, so the canonical stored
    // form is a bare empty <p></p>.
    expect(block.properties.content).toContain('<p></p>');
    expect(block.properties.content).not.toContain('<br>');

    const div = document.createElement('div');
    const editor = new Editor({
      element: div,
      extensions: getExtensions(),
      content: block.properties.content,
    });
    const canvasHtml = div.querySelector('.ProseMirror')!.innerHTML;
    const canvasTrailingBreaks = (canvasHtml.match(/ProseMirror-trailingBreak/g) ?? []).length;
    expect(canvasTrailingBreaks).toBe(2);
    expect(canvasHtml).not.toMatch(/<br>\s*<br class="ProseMirror-trailingBreak">/);
    editor.destroy();

    const regen = generateMJML(parsed);
    // Generator should inject <br> into each empty <p>
    const filledCount = (regen.match(/<p[^>]*><br><\/p>/g) ?? []).length;
    expect(filledCount).toBe(2);

    const compiled = (mjml2html as any)(regen, { validationLevel: 'soft', minify: false });
    const previewMatch = compiled.html.match(/<div\s+style="font-family[^>]*>([\s\S]*?)<\/div>\s*<\/td>/)!;
    const previewBlankLines = (previewMatch[1].match(/<p[^>]*><br><\/p>/g) ?? []).length;
    expect(previewBlankLines).toBe(2);
  });

  it('re-import strips the injected <br> so canvas content stays empty', () => {
    const original = `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text><p>First.</p><p style="margin:0"/><p>Second.</p></mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

    const parsed1 = parseMJML(original);
    const regen1 = generateMJML(parsed1);

    // The generator's output should contain the filled <br>
    expect(regen1).toMatch(/<p[^>]*><br><\/p>/);

    const parsed2 = parseMJML(regen1);

    // After re-parse, the stored canvas content must NOT have the injected <br>
    // (otherwise TipTap would parse it as a HardBreak AND add its own trailing
    // break, doubling the visible blank line on each round trip).
    const block = parsed2.sections[0].columns[0].blocks[0];
    expect(block.properties.content).not.toContain('<br>');
  });
});
