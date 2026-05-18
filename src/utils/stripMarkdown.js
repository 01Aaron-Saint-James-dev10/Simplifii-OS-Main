/**
 * Strip common markdown formatting to produce plain text.
 * Used to clean AI output before display in plain-text surfaces
 * and before insertion into the Tier 3 editor.
 */
export default function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    // Headers: ## heading → heading
    .replace(/^#{1,6}\s+/gm, '')
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Italic: *text* or _text_ (word-boundary safe to avoid snake_case)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1')
    // Links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Inline code: `code` → code
    .replace(/`([^`]+)`/g, '$1')
    // Bullet markers: - item or * item → item
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Numbered list markers: 1. item → item
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // AURA tool tags: [TOOL:simplify] → (stripped, must never reach editor or display)
    .replace(/\s*\[TOOL:\w+\]\s*/g, '')
    .trim();
}
