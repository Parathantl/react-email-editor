import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';

/**
 * Parse a CSS module file and return a mapping of class names.
 * Handles `composes` directives by combining class names.
 */
function parseCssModuleClasses(cssPath: string): Record<string, string> {
  const css = readFileSync(cssPath, 'utf8');
  const classNames = new Map<string, string>();
  let currentClass = '';

  for (const line of css.split('\n')) {
    // Match class definitions: .className {  or .className,  or .className:
    const classMatch = line.match(/\.([a-zA-Z_][\w-]*)\s*[{,:\s[]/);
    if (classMatch) {
      const name = classMatch[1];
      if (!classNames.has(name)) classNames.set(name, name);
      currentClass = name;
    }
    // Match composes: otherClass;
    const composesMatch = line.match(/composes:\s*([\w-]+)\s*;/);
    if (composesMatch && currentClass) {
      const existing = classNames.get(currentClass) || currentClass;
      classNames.set(currentClass, `${existing} ${composesMatch[1]}`);
    }
  }

  return Object.fromEntries(classNames);
}

/**
 * Post-process JS bundle to replace empty CSS module objects with actual class name mappings.
 *
 * tsup/esbuild extracts CSS to dist/index.css but sets all `.module.css` JS imports to `{}`.
 * This function parses the source CSS module files and patches the JS output with correct mappings.
 */
function patchCssModules() {
  const stylesDir = resolve(__dirname, 'src/styles');
  const cssModuleFiles = readdirSync(stylesDir).filter((f) => f.endsWith('.module.css'));

  // Build mapping: variable name prefix -> class name mapping
  // e.g. "blocks" -> { textBlock: "textBlock", buttonBlock: "buttonBlock", ... }
  const moduleMappings = new Map<string, Record<string, string>>();
  for (const file of cssModuleFiles) {
    const name = basename(file, '.module.css').replace(/-/g, '_');
    const classes = parseCssModuleClasses(resolve(stylesDir, file));
    moduleMappings.set(name, classes);
  }

  // Patch both ESM and CJS outputs
  for (const jsFile of ['dist/index.js', 'dist/index.cjs']) {
    const fullPath = resolve(__dirname, jsFile);
    let js: string;
    try {
      js = readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    let patched = false;
    for (const [name, classes] of moduleMappings) {
      // Match: var {name}_default = {};
      // The variable names follow the pattern: filename (with hyphens as underscores) + _default
      const varPattern = new RegExp(
        `var ${name}_default(\\d*)\\s*=\\s*\\{\\};`,
        'g',
      );
      js = js.replace(varPattern, (match, suffix) => {
        patched = true;
        const entries = Object.entries(classes)
          .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
          .join(',\n');
        return `var ${name}_default${suffix} = {\n${entries}\n};`;
      });
    }

    if (patched) {
      writeFileSync(fullPath, js);
    }
  }
}

/**
 * Strip CSS module `:global()` wrappers from the dist CSS.
 * tsup/esbuild extracts CSS modules but preserves `:global()` syntax
 * which browsers don't understand. This converts e.g.
 *   `.tiptapWrapper :global(.ProseMirror)` → `.tiptapWrapper .ProseMirror`
 */
function stripCssGlobals() {
  const cssPath = resolve(__dirname, 'dist/index.css');
  try {
    let css = readFileSync(cssPath, 'utf8');
    // Replace :global(.className) with .className
    css = css.replace(/:global\(([^)]+)\)/g, '$1');
    writeFileSync(cssPath, css);
  } catch {
    // dist/index.css may not exist
  }
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'mjml-browser', 'nanoid'],
  // Bundle @tiptap/* and other deps so consumers don't hit version conflicts
  // (e.g. webapp uses @blocknote with @tiptap v3, this library needs @tiptap v2)
  noExternal: [/^@tiptap/, 'dompurify'],
  // Replace process.env.NODE_ENV so bundled use-sync-external-store shim
  // works in the browser without relying on the consumer's bundler
  env: { NODE_ENV: 'production' },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  async onSuccess() {
    patchCssModules();
    stripCssGlobals();
  },
});
