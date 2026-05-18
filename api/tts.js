/**
 * /api/tts
 *
 * Browser TTS only. ElevenLabs removed pending subscription.
 * Frontend must use window.speechSynthesis directly.
 */

export default async function handler(req, res) {
  return res.status(200).json({ provider: 'browser', message: 'Use window.speechSynthesis in the frontend.' });
}
