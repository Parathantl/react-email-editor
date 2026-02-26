import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

const INDENT_STEP = 24; // px per level
const MAX_INDENT = 240; // 10 levels

/** Increase margin-left on the paragraph/heading at the cursor. */
export function applyIndent(editor: Editor): boolean {
  const { state, view } = editor;
  const { tr } = state;
  const { from, to } = state.selection;
  let changed = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const current = (node.attrs.indent as number) || 0;
      if (current < MAX_INDENT) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current + INDENT_STEP });
        changed = true;
      }
    }
  });

  if (changed) view.dispatch(tr);
  return changed;
}

/** Decrease margin-left on the paragraph/heading at the cursor. */
export function applyOutdent(editor: Editor): boolean {
  const { state, view } = editor;
  const { tr } = state;
  const { from, to } = state.selection;
  let changed = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const current = (node.attrs.indent as number) || 0;
      if (current > 0) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: Math.max(0, current - INDENT_STEP) });
        changed = true;
      }
    }
  });

  if (changed) view.dispatch(tr);
  return changed;
}

export const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => parseInt(element.style.marginLeft, 10) || 0,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent}px` };
            },
          },
        },
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive('listItem')) {
          editor.commands.sinkListItem('listItem');
          return true; // always prevent focus loss
        }
        applyIndent(editor);
        return true; // always prevent Tab from leaving editor
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('listItem')) {
          editor.commands.liftListItem('listItem');
          return true;
        }
        applyOutdent(editor);
        return true;
      },
    };
  },
});
