export interface CompileResult {
  html: string;
  errors: CompileError[];
}

export interface CompileError {
  line: number;
  message: string;
  tagName: string;
}

let mjmlBrowser: any = null;

async function loadMjmlBrowser(): Promise<any> {
  if (mjmlBrowser) return mjmlBrowser;
  try {
    const mod: any = await import('mjml-browser');
    // Handle both ESM default export and CJS interop
    const fn = mod.default ?? mod;
    if (typeof fn === 'function') {
      mjmlBrowser = fn;
    } else if (fn && typeof fn.default === 'function') {
      // Double-wrapped default (some bundlers do this)
      mjmlBrowser = fn.default;
    }
    return mjmlBrowser;
  } catch {
    return null;
  }
}

export async function compileMJMLToHTML(mjmlString: string): Promise<CompileResult> {
  const mjml = await loadMjmlBrowser();

  if (!mjml) {
    // Fallback: wrap in basic HTML without full MJML compilation
    return {
      html: wrapFallbackHTML(mjmlString),
      errors: [{ line: 0, message: 'mjml-browser not available, using fallback rendering', tagName: '' }],
    };
  }

  try {
    const result = mjml(mjmlString, {
      validationLevel: 'soft',
      minify: false,
    });

    return {
      html: result.html,
      errors: (result.errors ?? []).map((err: any) => ({
        line: err.line ?? 0,
        message: err.message ?? 'Unknown error',
        tagName: err.tagName ?? '',
      })),
    };
  } catch (err) {
    return {
      html: '',
      errors: [{ line: 0, message: String(err), tagName: '' }],
    };
  }
}

function wrapFallbackHTML(mjml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
    .fallback-notice { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    pre { white-space: pre-wrap; word-wrap: break-word; background: #fff; padding: 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="fallback-notice">
    <p>Install <code>mjml-browser</code> for full HTML preview.</p>
  </div>
  <pre>${mjml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
}
