/**
 * /api/audio-overview
 *
 * Stub endpoint for audio overview generation.
 * Returns 501 Not Implemented until TTS integration is built.
 */
export default function handler(req, res) {
  return res.status(501).json({
    success: false,
    error: 'Audio overview generation is coming soon.',
    message: 'This feature will generate an audio summary of your assessment brief using text-to-speech.',
  });
}
