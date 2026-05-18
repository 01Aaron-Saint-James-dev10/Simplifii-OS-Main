/**
 * /api/tts
 *
 * Text-to-speech via Cartesia Sonic 2 REST API.
 * Returns audio/wav when CARTESIA_API_KEY is set.
 * Falls back to { provider: 'browser' } for client-side speechSynthesis.
 *
 * POST { text, voiceId? }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { text, voiceId } = req.body || {};
  if (!text || text.length < 2) return res.status(400).json({ error: 'Text required.' });

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis.' });

  try {
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-2',
        transcript: text.slice(0, 1000),
        voice: {
          mode: 'id',
          id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091',
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 24000,
        },
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[tts] Cartesia API error:', response.status, errText);
      return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis.', detail: `${response.status} ${errText.slice(0, 200)}` });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Convert raw PCM f32le to WAV for browser playback
    const numSamples = audioBuffer.length / 4; // f32le = 4 bytes per sample
    const wavHeader = Buffer.alloc(44);
    const dataSize = numSamples * 2; // 16-bit output
    const fileSize = 36 + dataSize;
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // chunk size
    wavHeader.writeUInt16LE(1, 20); // PCM
    wavHeader.writeUInt16LE(1, 22); // mono
    wavHeader.writeUInt32LE(24000, 24); // sample rate
    wavHeader.writeUInt32LE(24000 * 2, 28); // byte rate
    wavHeader.writeUInt16LE(2, 32); // block align
    wavHeader.writeUInt16LE(16, 34); // bits per sample
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    // Convert f32le to s16le
    const pcm16 = Buffer.alloc(dataSize);
    for (let i = 0; i < numSamples; i++) {
      const f = audioBuffer.readFloatLE(i * 4);
      const clamped = Math.max(-1, Math.min(1, f));
      pcm16.writeInt16LE(Math.round(clamped * 32767), i * 2);
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');
    return res.end(Buffer.concat([wavHeader, pcm16]));
  } catch (err) {
    console.error('[tts] Cartesia error:', err.message);
    return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis.', detail: err.message });
  }
}
