declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'mjml-browser' {
  function mjml(
    input: string,
    options?: { validationLevel?: string; minify?: boolean },
  ): { html: string; errors: Array<{ line?: number; message?: string; tagName?: string }> };
  export default mjml;
}
