import activeFiles from '../grounding/activeManifest.json';

const SCIENCE_CODES = ['BABS1201', 'BABS1202'];

export const runNeuralScan = () => {
  const joined = activeFiles.join(' ');
  const matched = SCIENCE_CODES.some(code => joined.includes(code));

  if (matched) {
    return { inferredFocus: 'Science/Biology', tier: 'Tertiary' };
  }

  return { inferredFocus: 'General Studies', tier: 'General' };
};
