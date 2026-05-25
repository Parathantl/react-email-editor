import type { EmailTemplate } from '../types';
import { generateMJML } from '../mjml/generator';
import { compileMJMLToHTML } from '../mjml/compiler';

// Forces backgrounds and colors to render in print output (browsers strip them
// by default) and aligns the page margins with the email body. We intentionally
// do NOT set `page-break-inside: avoid` on the MJML wrapper tables/cells —
// MJML nests everything in tables, so that rule causes tall sections to be
// pushed to a new page (leaving a blank page) and can clip content at the
// bottom. Only images get break protection so they aren't split mid-figure.
const PRINT_STYLES = `
<style>
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @page { margin: 0; }
  @media print {
    html, body { margin: 0; padding: 0; }
    img {
      max-width: 100% !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    p, li, h1, h2, h3, h4, h5, h6 {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
    }
  }
</style>
`;

const ASSET_WAIT_TIMEOUT_MS = 5000;
const CLEANUP_FALLBACK_MS = 60000;

function waitForAssets(doc: Document, win: Window): Promise<void> {
  const fontsReady: Promise<unknown> =
    (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ??
    Promise.resolve();

  const images = Array.from(doc.images);
  const imgPromises = images.map((img) =>
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }),
  );

  const timeout = new Promise<void>((resolve) =>
    win.setTimeout(resolve, ASSET_WAIT_TIMEOUT_MS),
  );

  return Promise.race([
    Promise.all([fontsReady, ...imgPromises]).then(() => undefined),
    timeout,
  ]);
}

export async function exportTemplateAsPDF(template: EmailTemplate): Promise<void> {
  const mjml = generateMJML(template);
  const result = await compileMJMLToHTML(mjml);

  const htmlWithPrintStyles = result.html.includes('</head>')
    ? result.html.replace('</head>', `${PRINT_STYLES}</head>`)
    : `${PRINT_STYLES}${result.html}`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  // Wait for the iframe to finish loading the srcdoc before we touch its
  // document, otherwise contentDocument is the about:blank placeholder and
  // image references inside the email haven't started loading yet.
  const loaded = new Promise<void>((resolve) => {
    iframe.addEventListener('load', () => resolve(), { once: true });
  });

  iframe.srcdoc = htmlWithPrintStyles;
  document.body.appendChild(iframe);

  try {
    await loaded;

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      cleanup();
      return;
    }

    await waitForAssets(doc, win);

    // afterprint fires on either "Save" or "Cancel" so it's the right cleanup
    // signal. Older Safari versions don't always fire it, hence the fallback.
    win.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, CLEANUP_FALLBACK_MS);

    win.focus();
    win.print();
  } catch {
    cleanup();
  }
}
