/**
 * PredictabilityService.js
 *
 * Every AI action announced before it happens. No surprises.
 * When predictability_announcements is enabled, the user must acknowledge
 * before the action proceeds. When disabled, a brief visual flash shows
 * and the action auto-proceeds.
 *
 * Usage:
 *   const result = await announceAction({
 *     type: 'ai_response',
 *     description: 'Send your question to the tutor',
 *     estimatedMs: 5000,
 *   });
 *   if (result === 'proceed') { ... do the action ... }
 *   if (result === 'cancel') { ... user cancelled ... }
 */

const ANNOUNCEMENT_EVENT = 'simplifii:announce-action';
const ANNOUNCEMENT_RESPONSE_EVENT = 'simplifii:announce-response';

let _announcementId = 0;

/**
 * Announce an upcoming action and wait for user response.
 *
 * @param {object} opts
 * @param {string} opts.type - 'ai_response' | 'transition' | 'modal' | 'suggestion'
 * @param {string} opts.description - human-readable description
 * @param {number} [opts.estimatedMs=5000] - estimated duration in ms
 * @param {boolean} [opts.requireAck=true] - require user acknowledgement
 * @returns {Promise<'proceed'|'cancel'>}
 */
export const announceAction = ({ type, description, estimatedMs = 5000, requireAck = true }) => {
  const id = ++_announcementId;

  return new Promise((resolve) => {
    // Listen for user response
    const handler = (e) => {
      if (e.detail?.id !== id) return;
      window.removeEventListener(ANNOUNCEMENT_RESPONSE_EVENT, handler);
      resolve(e.detail.action); // 'proceed' or 'cancel'
    };
    window.addEventListener(ANNOUNCEMENT_RESPONSE_EVENT, handler);

    // Dispatch announcement to the banner
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_EVENT, {
      detail: { id, type, description, estimatedMs, requireAck }
    }));

    // Auto-proceed after 10s if no response (safety net)
    setTimeout(() => {
      window.removeEventListener(ANNOUNCEMENT_RESPONSE_EVENT, handler);
      resolve('proceed');
    }, 10000);
  });
};

/**
 * Respond to an announcement (called by AnnouncementBanner).
 */
export const respondToAnnouncement = (id, action) => {
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_RESPONSE_EVENT, {
    detail: { id, action }
  }));
};

/**
 * Announce a panel transition (non-blocking, visual only).
 */
export const announceTransition = (panelName) => {
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_EVENT, {
    detail: {
      id: ++_announcementId,
      type: 'transition',
      description: `Now showing: ${panelName}`,
      estimatedMs: 0,
      requireAck: false,
    }
  }));
};

export { ANNOUNCEMENT_EVENT };
