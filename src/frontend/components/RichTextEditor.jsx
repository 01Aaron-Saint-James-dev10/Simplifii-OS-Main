import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import EditorToolbar from './EditorToolbar';
import { useSettings } from '../SettingsContext';
import './RichTextEditor.css';

/**
 * RichTextEditor
 *
 * TipTap-powered rich text editor replacing the legacy textarea.
 * Preserves the same external API as CanvasEditor.legacy.jsx:
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

export default function RichTextEditor({ initialContent, onTextChange, onWordCountChange, onJsonChange }) {
  const { fontScale, lineSpacing } = useSettings();
  const editorRef = useRef(null);

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

  // Report initial word count on mount
  useEffect(() => {
    if (!editor) return;
    const words = editor.storage.characterCount?.words() ?? 0;
    onWordCountChange?.(words);
  }, [editor, onWordCountChange]);

  return (
    <div
      className="rich-editor"
      data-font-scale={fontScale || 'normal'}
      data-line-spacing={lineSpacing || 'normal'}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
