/**
 * /api/tts
 *
 * Text-to-speech via ElevenLabs API. Returns audio stream.
 * Used by the AURA voice mode for natural spoken output.
 *
 * POST { text, voiceId? }
 * Returns: audio/mpeg stream
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
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    // Fallback: return empty so client uses browser TTS
    return res.status(200).json({ success: false, fallback: true, error: 'TTS not configured. Using browser voice.' });
  }

  if (!text || text.length < 2) {
    return res.status(400).json({ success: false, error: 'Text required.' });
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
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, fallback: true, error: 'TTS service unavailable.' });
    }

    // Stream audio back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    const arrayBuffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch {
    return res.status(200).json({ success: false, fallback: true, error: 'TTS failed.' });
  }
}
