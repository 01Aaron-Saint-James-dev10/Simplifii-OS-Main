/**
 * logger.js
 *
 * Centralised logging for Simplifii-OS. All service and core modules
 * should import from here instead of using console.* directly.
 *
 * In production, info and debug calls are silenced. Warnings and errors
 * always surface. Override via localStorage.simplifii_log_level:
 *   'debug' | 'info' | 'warn' | 'error' | 'silent'
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const getLevel = () => {
  if (typeof window === 'undefined') return LEVELS.info;
  try {
    const stored = window.localStorage.getItem('simplifii_log_level');
    if (stored && LEVELS[stored] !== undefined) return LEVELS[stored];
  } catch { /* sandboxed iframe */ }
  return process.env.NODE_ENV === 'production' ? LEVELS.warn : LEVELS.info;
};

const noop = () => {};
const safeConsole = typeof console !== 'undefined' ? console : { debug: noop, info: noop, warn: noop, error: noop };

/**
 * Create a namespaced logger.
 * @param {string} namespace - e.g. 'BriefService', 'RewriteService'
 * @returns {{ debug, info, warn, error }}
 */
export const createLogger = (namespace) => {
  const prefix = `[${namespace}]`;
  return {
    debug: (...args) => { if (getLevel() <= LEVELS.debug) safeConsole.debug(prefix, ...args); },
    info:  (...args) => { if (getLevel() <= LEVELS.info)  safeConsole.info(prefix, ...args); },
    warn:  (...args) => { if (getLevel() <= LEVELS.warn)  safeConsole.warn(prefix, ...args); },
    error: (...args) => { if (getLevel() <= LEVELS.error) safeConsole.error(prefix, ...args); },
  };
};
