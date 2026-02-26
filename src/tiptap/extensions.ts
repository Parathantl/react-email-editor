import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { mergeAttributes } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { VariableNode } from './VariableNode';
import { FontSize } from './FontSize';
import { FontFamily } from './FontFamily';
import { Indent } from './Indent';

export function getExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      history: false,
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    Highlight.extend({
      renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      parseHTML() {
        return [
          { tag: 'mark' },
          {
            tag: 'span[style]',
            getAttrs: (el) => {
              if (!(el as HTMLElement).style.backgroundColor) return false;
              return {};
            },
          },
        ];
      },
    }).configure({ multicolor: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Placeholder.configure({
      placeholder: placeholder ?? 'Type something...',
    }),
    Indent,
    VariableNode,
  ];
}
