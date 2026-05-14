/**
 * CitationHighlightExtension.js
 *
 * TipTap extension that applies an amber wavy underline to in-text
 * citation strings that are not yet verified in the corpus.
 *
 * Usage:
 *   CitationHighlightExtension.configure({ flags: ['(Smith, 2023)', ...] })
 *
 * When flags change outside of a doc edit, signal the plugin to rebuild:
 *   editor.view.dispatch(editor.state.tr.setMeta(citationHighlightKey, true))
 */

import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const citationHighlightKey = new PluginKey('citationHighlight');

function buildDecorations(doc, flags) {
  if (!flags || flags.length === 0) return DecorationSet.empty;

  const decorations = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const text = node.text;
    for (const flag of flags) {
      if (!flag) continue;
      let from = 0;
      while (from < text.length) {
        const idx = text.indexOf(flag, from);
        if (idx === -1) break;
        decorations.push(
          Decoration.inline(pos + idx, pos + idx + flag.length, {
            // allow-style: CSS property names
            style: 'text-decoration: underline wavy; text-decoration-color: #f59e0b; text-underline-offset: 3px; cursor: help;',
            class: 'citation-unverified',
            title: 'Citation not verified in corpus',
          })
        );
        from = idx + flag.length;
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const CitationHighlightExtension = Extension.create({
  name: 'citationHighlight',

  addOptions() {
    return { flags: [] };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      new Plugin({
        key: citationHighlightKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc, ext.options.flags);
          },
          apply(tr, old, _oldState, newState) {
            if (tr.docChanged || tr.getMeta(citationHighlightKey)) {
              return buildDecorations(newState.doc, ext.options.flags);
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export default CitationHighlightExtension;
