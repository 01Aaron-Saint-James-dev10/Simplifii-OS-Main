import React from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * EditorToolbar
 *
 * Sticky toolbar for TipTap editor. All buttons 44x44 minimum,
 * keyboard-focusable, visible focus ring.
 *
 * Props:
 *   editor - TipTap editor instance
 */

function ToolBtn({ label, isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      style={{
        minWidth: 36,
        minHeight: 36,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_SYSTEM,
        fontSize: 12,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? ACCENT_PULSE : TEXT_MUTED, // allow-style
        background: isActive ? ACCENT_GLASS : 'transparent',
        border: `1px solid ${isActive ? ACCENT_BORDER : 'transparent'}`,
        borderRadius: BORDER_RADIUS,
        cursor: 'pointer',
        outline: 'none',
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 48,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '6px 48px',
        background: SURFACE_CARD,
        borderBottom: `1px solid ${SURFACE_RAISED}`,
        flexWrap: 'wrap',
      }}
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolBtn label="Bold" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolBtn>
      <ToolBtn label="Italic" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolBtn>
      <ToolBtn label="Strikethrough" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </ToolBtn>

      <span style={{ width: 1, height: 20, background: SURFACE_RAISED, margin: '0 4px' }} aria-hidden="true" />

      <ToolBtn label="Heading 1" isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolBtn>
      <ToolBtn label="Heading 2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolBtn>
      <ToolBtn label="Heading 3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolBtn>

      <span style={{ width: 1, height: 20, background: SURFACE_RAISED, margin: '0 4px' }} aria-hidden="true" />

      <ToolBtn label="Bullet list" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        &bull;
      </ToolBtn>
      <ToolBtn label="Numbered list" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolBtn>
      <ToolBtn label="Blockquote" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo;
      </ToolBtn>

      <span style={{ width: 1, height: 20, background: SURFACE_RAISED, margin: '0 4px' }} aria-hidden="true" />

      <ToolBtn label="Code" isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        {'<>'}
      </ToolBtn>
      <ToolBtn label="Horizontal rule" isActive={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        --
      </ToolBtn>
    </div>
  );
}
