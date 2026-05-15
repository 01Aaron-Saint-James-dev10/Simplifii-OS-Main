/**
 * RewriteLocalMock.js
 *
 * Deterministic level-aware transforms for the local-mock provider.
 * Used when Ollama is unavailable or explicitly selected.
 * Extracted from RewriteService.js.
 */

import {
  swapByLevel,
  LOGIC_FRAMES,
  extractGroundingCitations,
} from './RewriteConstants';

const localMock = {
  async elevateRigour(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    const opener = ctx.level === 'highschool'
      ? `Looking at this carefully, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`
      : `Drawing on the peer-reviewed literature, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`;
    return { text: opener, groundingCitations: extractGroundingCitations(text, ctx.sourceName) };
  },
  async synthesise(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    return {
      text: `Synthesising the evidence reviewed above: ${swapped}`,
      groundingCitations: extractGroundingCitations(text, ctx.sourceName)
    };
  },
  async applyLogicMode(text, mode, ctx = {}) {
    if (mode === 'easy_read') {
      const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 5);
      return `Here is the key idea in plain English:\n${sentences.join(' ')}`;
    }
    if (mode === 'faded_scaffold') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const splitAt = Math.max(1, Math.ceil(sentences.length * 0.67));
      const polished = sentences.slice(0, splitAt).join(' ');
      const stems = sentences.slice(splitAt).map((s, i) =>
        `[STEM ${i + 1}: "${s.split(' ').slice(0, 4).join(' ')}..."]`
      ).join(' ');
      return `${polished} ${stems || '[STEM 1: "Building on this argument..."] [STEM 2: "This suggests that..."]'}`;
    }
    if (mode === 'align_to_rubric') {
      const criteria = (Array.isArray(ctx.hdCriteria) && ctx.hdCriteria.length > 0)
        ? ctx.hdCriteria
        : ['Critical Analysis', 'Evidence and Referencing', 'Originality', 'Argument Coherence'];
      const review = criteria.map((c, i) => `${i + 1}. ${c}: Review your passage to ensure this criterion is addressed.`).join('\n');
      return `Reviewing against HD criteria:\n${review}`;
    }
    if (mode === 'universal_view') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const academic = sentences.map(s => swapByLevel(s, ctx?.level || 'university')).join(' ');
      const plain = sentences.map(s => s.replace(/\b(\w{10,})\b/g, w => w)).join(' ');
      const actions = sentences.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `ACADEMIC:\n${academic}\n\nPLAIN:\n${plain}\n\nACTIONS:\n${actions}`;
    }
    if (mode === 'easl_bridge') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const instructions = sentences.map((s, i) => `${i + 1}. ${s.replace(/\b(utilise|leverage|endeavour|facilitate|commence|henceforth|pursuant|thereof)\b/gi, (m) => ({ utilise: 'use', leverage: 'use', endeavour: 'try', facilitate: 'help', commence: 'start', henceforth: 'from now on', pursuant: 'following', thereof: 'of it' }[m.toLowerCase()] || m))}`).join('\n');
      return `Plain-language version of the instructions:\n\n${instructions}`;
    }
    if (mode === 'friction_to_action') {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 8);
      const verbs = ['Read', 'Write', 'Review', 'Submit', 'Check', 'Identify', 'Draft', 'Finalise'];
      const steps = sentences.map((s, i) => `${i + 1}. **${verbs[i] || 'Complete'}** ${s.charAt(0).toLowerCase()}${s.slice(1)}`).join('\n');
      return `${steps}\n\nDefinition of Done: All steps above are complete and the section is ready to submit.`;
    }
    const frame = LOGIC_FRAMES[mode] || 'Working from the active logic frame:';
    const swapped = swapByLevel(text, ctx?.level);
    return `${frame} ${swapped}`;
  }
};

export default localMock;
