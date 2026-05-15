import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { BionicReadingExtension } from './extensions/BionicReadingExtension';
import { CitationHighlightExtension, citationHighlightKey } from './extensions/CitationHighlightExtension';
import EditorToolbar from './EditorToolbar';
import { useSettings } from '../SettingsContext';
import './RichTextEditor.css';

/**
 * RichTextEditor
 *
 * TipTap-powered rich text editor replacing the legacy textarea.
 * Preserves the same external API as the original textarea editor:
 *   - onTextChange(htmlString)
 *   - onWordCountChange(count)
 *   - onSave(jsonDoc) called by parent's autosave timer
 *
 * Props:
 *   initialContent  - TipTap JSON doc or null
 *   onTextChange    - callback(html string) on every edit
 *   onWordCountChange - callback(wordCount number) on every edit
 *   onJsonChange    - callback(tiptapJsonDoc) on every edit (for autosave)
 */

export default function RichTextEditor({ initialContent, onTextChange, onWordCountChange, onJsonChange, citationFlags }) {
  const { fontScale, lineSpacing, isBionicActive } = useSettings();
  const [fontFamily, setFontFamily] = React.useState(() =>
    localStorage.getItem('simplifii_editor_font') || 'inter'
  );
  const editorRef = useRef(null);

  // Listen for font change from CanvasSettingsOverlay
  useEffect(() => {
    const handler = (e) => setFontFamily(e.detail?.font || 'inter');
    window.addEventListener('simplifii:font-change', handler);
    return () => window.removeEventListener('simplifii:font-change', handler);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      CharacterCount,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      BionicReadingExtension.configure({
        enabled: isBionicActive,
      }),
      CitationHighlightExtension.configure({
        flags: citationFlags || [],
      }),
    ],
    content: initialContent || '',
    autofocus: 'end',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      const words = ed.storage.characterCount?.words() ?? 0;
      onTextChange?.(html);
      onJsonChange?.(json);
      onWordCountChange?.(words);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Voice input: insert transcript at cursor when voice-transcript event fires
  useEffect(() => {
    const handler = (e) => {
      const text = e.detail?.text;
      if (!text || !editorRef.current) return;
      // Detect voice joke command
      if (text.toLowerCase().includes('tell me a joke') || text.toLowerCase().includes('make me laugh')) {
        window.dispatchEvent(new CustomEvent('simplifii:joke-request'));
        return;
      }
      editorRef.current.chain().focus().insertContent(text).run();
    };
    window.addEventListener('simplifii:voice-transcript', handler);
    return () => window.removeEventListener('simplifii:voice-transcript', handler);
  }, []);

  // Slash command detection: /joke triggers joke overlay
  useEffect(() => {
    if (!editor) return;
    const checkSlash = () => {
      const text = editor.getText();
      if (text.endsWith('/joke')) {
        editor.commands.deleteRange({ from: editor.state.selection.from - 5, to: editor.state.selection.from });
        window.dispatchEvent(new CustomEvent('simplifii:joke-request'));
      }
    };
    editor.on('update', checkSlash);
    return () => editor.off('update', checkSlash);
  }, [editor]);

  // Toggle Bionic Reading decorations when setting changes
  useEffect(() => {
    if (!editor) return;
    const bionicExt = editor.extensionManager.extensions.find(e => e.name === 'bionicReading');
    if (bionicExt) {
      bionicExt.options.enabled = isBionicActive;
      // Signal the plugin to rebuild decorations
      editor.view.dispatch(editor.state.tr.setMeta('bionicReading', true));
    }
  }, [editor, isBionicActive]);

  // Report initial word count on mount
  useEffect(() => {
    if (!editor) return;
    const words = editor.storage.characterCount?.words() ?? 0;
    onWordCountChange?.(words);
  }, [editor, onWordCountChange]);

  // Rebuild citation highlight decorations when flags change
  useEffect(() => {
    if (!editor) return;
    const citationExt = editor.extensionManager.extensions.find(e => e.name === 'citationHighlight');
    if (citationExt) {
      citationExt.options.flags = citationFlags || [];
      editor.view.dispatch(editor.state.tr.setMeta(citationHighlightKey, true));
    }
  }, [editor, citationFlags]);

  // Insert citation text at cursor when requested by CitationInserter
  useEffect(() => {
    const handler = (e) => {
      if (!editor || !e.detail?.text) return;
      editor.chain().focus().insertContent(e.detail.text).run();
    };
    window.addEventListener('simplifii:insert-citation', handler);
    return () => window.removeEventListener('simplifii:insert-citation', handler);
  }, [editor]);

  return (
    <div
      className="rich-editor"
      data-font-scale={fontScale || 'normal'}
      data-line-spacing={lineSpacing || 'normal'}
      data-font-family={fontFamily || 'inter'}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
