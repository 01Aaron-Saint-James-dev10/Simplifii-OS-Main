/**
 * BionicReadingExtension.js
 *
 * TipTap extension that applies Bionic Reading transformation in the
 * render path only. First ceil(length * 0.4) characters of each word
 * render bold; the rest render normal weight. Stored content stays raw.
 */

import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const bionicKey = new PluginKey('bionicReading');

function buildDecorations(doc, enabled) {
  if (!enabled) return DecorationSet.empty;

  const decorations = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const text = node.text;
    let offset = 0;

    // Split on whitespace to find words
    const parts = text.split(/(\s+)/);
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        offset += part.length;
        continue;
      }
      if (part.length === 0) continue;

      const boldCount = Math.ceil(part.length * 0.4);
      if (boldCount > 0 && boldCount < part.length) {
        // Bold the first portion
        decorations.push(
          Decoration.inline(pos + offset, pos + offset + boldCount, {
            style: 'font-weight: 700',
          })
        );
      } else if (boldCount >= part.length) {
        // Entire short word bold
        decorations.push(
          Decoration.inline(pos + offset, pos + offset + part.length, {
            style: 'font-weight: 700',
          })
        );
      }
      offset += part.length;
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const BionicReadingExtension = Extension.create({
  name: 'bionicReading',

  addOptions() {
    return { enabled: false };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      new Plugin({
        key: bionicKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc, ext.options.enabled);
          },
          apply(tr, oldDecorations, oldState, newState) {
            // Rebuild on any doc change or when meta signals a toggle
            if (tr.docChanged || tr.getMeta(bionicKey)) {
              return buildDecorations(newState.doc, ext.options.enabled);
            }
            return oldDecorations;
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

export default BionicReadingExtension;
