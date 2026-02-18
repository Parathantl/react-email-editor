import { Node, mergeAttributes } from '@tiptap/core';

export interface VariableNodeAttrs {
  key: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variableNode: {
      insertVariable: (key: string) => ReturnType;
    };
  }
}

export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-variable-key'),
        renderHTML: (attributes: Record<string, any>) => ({
          'data-variable-key': attributes.key,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'ee-variable-chip',
        contenteditable: 'false',
      }),
      `{{ ${HTMLAttributes['data-variable-key']} }}`,
    ];
  },

  addCommands() {
    return {
      insertVariable:
        (key: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { key },
          });
        },
    };
  },
});
