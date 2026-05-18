/**
 * /api/tts
 *
 * Text-to-speech via Cartesia Sonic 2.
 * Returns audio/mpeg when CARTESIA_API_KEY is set.
 * Falls back to { provider: 'browser' } for client-side speechSynthesis.
 *
 * POST { text, voiceId? }
 */

import { Cartesia } from '@cartesia/cartesia-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { text, voiceId } = req.body || {};
  if (!text || text.length < 2) return res.status(400).json({ error: 'Text required.' });

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis.' });

  try {
    const cartesia = new Cartesia({ apiKey });
    const response = await cartesia.tts.bytes({
      modelId: 'sonic-2',
      transcript: text.slice(0, 1000),
      voice: {
        mode: 'id',
        id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091',
      },
      outputFormat: {
        container: 'mp3',
        encoding: 'mp3',
        sampleRate: 44100,
      },
      language: 'en',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.end(buffer);
  } catch (err) {
    console.error('[tts] Cartesia error:', err.message);
    return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis.' });
  }
}
