/**
 * /api/tts
 *
 * Text-to-speech via ElevenLabs API. Returns base64 audio.
 * Used by the AURA voice mode for natural spoken output.
 *
 * POST { text, voiceId? }
 * Returns: { audio: base64, format: 'mp3', provider: 'elevenlabs' }
 *      or: { provider: 'browser' } (fallback when no key)
 *
 * Env: ELEVENLABS_API_KEY
 */

import { rateLimit, getIdentifier } from './_rateLimit.js';

// Default voice: Rachel (warm, clear, Australian-compatible)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const limited = rateLimit(getIdentifier(req), { maxRequests: 20, windowMs: 60000 });
  if (limited) return res.status(429).json({ success: false, error: limited.error });

  const { text, voiceId } = req.body || {};

  if (!text || text.length < 2) {
    return res.status(400).json({ success: false, error: 'Text required.' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // No key: client falls back to browser SpeechSynthesis
    return res.status(200).json({ provider: 'browser' });
  }

  // Cap text length (ElevenLabs charges per character)
  const cleanText = text.slice(0, 1000);
  const voice = voiceId || DEFAULT_VOICE_ID;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      return res.status(200).json({ provider: 'browser', error: 'ElevenLabs unavailable.' });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    return res.status(200).json({ audio: base64, format: 'mp3', provider: 'elevenlabs' });
  } catch {
    return res.status(200).json({ provider: 'browser', error: 'TTS failed.' });
  }
}
