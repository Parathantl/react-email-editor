import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import type { Variable } from '../types';
import {
  VariableSuggestionPopup,
  type VariableSuggestionPopupHandle,
  type VariableSuggestionCommand,
} from '../components/Canvas/blocks/VariableSuggestionPopup';

export interface VariableSuggestionConfig {
  /** Returns the current full list of variables (called fresh on every keystroke). */
  getVariables: () => Variable[];
  /**
   * Called when the user picks "Create variable" inline. Should add the variable
   * (deduplicated) and return the resulting Variable, or null if creation failed.
   */
  onAddVariable?: (key: string) => Variable | null;
}

const SUGGESTION_LIMIT = 8;

/** Sanitize a free-form query into a valid variable key. Mirrors AddVariableForm. */
function sanitizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function filterVariables(variables: Variable[], query: string): Variable[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return variables.slice(0, SUGGESTION_LIMIT);
  return variables
    .filter(
      (v) =>
        v.key.toLowerCase().includes(lower) ||
        (v.label?.toLowerCase().includes(lower) ?? false),
    )
    .slice(0, SUGGESTION_LIMIT);
}

/** Initialize the host element so it never falls back to static document flow. */
function initHost(host: HTMLElement) {
  host.style.position = 'fixed';
  host.style.top = '-9999px';
  host.style.left = '-9999px';
  host.style.zIndex = '10000';
  host.style.pointerEvents = 'auto';
}

/**
 * Position the popup host relative to the cursor's clientRect.
 * Flips above the cursor when there isn't room below. Uses visualViewport
 * when available so an open mobile keyboard correctly forces the flip.
 */
function positionHost(host: HTMLElement, rect: DOMRect | null | undefined) {
  if (!rect) return;
  const vv = window.visualViewport;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const viewportWidth = vv?.width ?? window.innerWidth;
  const popupHeight = host.offsetHeight || 200;
  const popupWidth = host.offsetWidth || 280;
  const showAbove = viewportHeight - rect.bottom < popupHeight + 8 && rect.top > popupHeight + 8;
  const left = Math.max(8, Math.min(rect.left, viewportWidth - popupWidth - 8));
  host.style.left = `${left}px`;
  host.style.top = showAbove
    ? `${rect.top - popupHeight - 4}px`
    : `${rect.bottom + 4}px`;
}

export const VariableSuggestion = Extension.create<VariableSuggestionConfig>({
  name: 'variableSuggestion',

  addOptions() {
    return {
      getVariables: () => [],
      onAddVariable: undefined,
    };
  },

  addProseMirrorPlugins() {
    const getVariables = () => this.options.getVariables();
    const onAddVariable = this.options.onAddVariable;

    return [
      Suggestion({
        editor: this.editor,
        char: '{{',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }) => filterVariables(getVariables(), query),
        command: ({ editor, range, props }) => {
          const variable = props as Variable;
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertVariable(variable.key)
            .run();
        },
        render: () => {
          let renderer: ReactRenderer<VariableSuggestionPopupHandle> | null = null;
          let host: HTMLDivElement | null = null;
          let getRect: (() => DOMRect | null) | null = null;

          const reposition = () => {
            if (host && getRect) positionHost(host, getRect());
          };

          const teardown = () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
            window.visualViewport?.removeEventListener('scroll', reposition);
            window.visualViewport?.removeEventListener('resize', reposition);
            renderer?.destroy();
            renderer = null;
            if (host?.parentNode) host.parentNode.removeChild(host);
            host = null;
            getRect = null;
          };

          const buildProps = (props: SuggestionProps<Variable>) => {
            const items = props.items;
            const query = props.query;
            const createKey = sanitizeKey(query);
            const canCreate =
              !!onAddVariable &&
              createKey.length > 0 &&
              !getVariables().some((v) => v.key === createKey);

            return {
              items,
              query,
              canCreate,
              createKey,
              command: (cmd: VariableSuggestionCommand) => {
                if (cmd.type === 'select') {
                  props.command(cmd.variable);
                  return;
                }
                // Create a new variable, then insert it.
                const created = onAddVariable?.(cmd.key) ?? null;
                if (!created) {
                  props.editor.commands.deleteRange(props.range);
                  return;
                }
                props.editor
                  .chain()
                  .focus()
                  .deleteRange(props.range)
                  .insertVariable(created.key)
                  .run();
              },
            };
          };

          return {
            onStart: (props) => {
              host = document.createElement('div');
              initHost(host);
              document.body.appendChild(host);

              renderer = new ReactRenderer(VariableSuggestionPopup, {
                editor: props.editor,
                props: buildProps(props),
              });
              host.appendChild(renderer.element);

              getRect = props.clientRect ?? null;

              // Capture-phase scroll catches scrolling on any ancestor scroll
              // container (canvas wrapper, body, etc.) — the popup follows the cursor.
              window.addEventListener('scroll', reposition, { capture: true, passive: true });
              window.addEventListener('resize', reposition);
              window.visualViewport?.addEventListener('scroll', reposition);
              window.visualViewport?.addEventListener('resize', reposition);

              // Wait one frame so the React tree is laid out before measuring height.
              requestAnimationFrame(reposition);
            },
            onUpdate: (props) => {
              if (!renderer || !host) return;
              renderer.updateProps(buildProps(props));
              getRect = props.clientRect ?? null;
              reposition();
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                teardown();
                return true;
              }
              return renderer?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              teardown();
            },
          };
        },
      }),
    ];
  },
});
