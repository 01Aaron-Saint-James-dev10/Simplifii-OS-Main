/**
 * setupProxy.js
 *
 * CRA dev-server middleware (webpack-dev-server 4, Express layer).
 * Adds Cross-Origin-Opener-Policy: same-origin-allow-popups to every
 * response so Google OAuth popups can hand the credential token back
 * to the page without being severed by COOP enforcement.
 *
 * This file is loaded automatically by react-scripts; no config change needed.
 * Production: set the same header in your hosting platform (Vercel / Nginx / Cloudfront).
 */

module.exports = function(app) {
  app.use(function(req, res, next) {
    // Allow OAuth popups (Google sign-in) to post messages back to the opener.
    // 'same-origin-allow-popups' is the correct value: stricter than the default
    // (unsafe-none) but permits the popup->opener channel Google Auth requires.
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    // COEP: unsafe-none is the permissive default. Do NOT set require-corp here
    // as that would block Google's iframe and third-party scripts.
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });
};
