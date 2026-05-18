export const auditProjectContext = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 800));

  // If the engine detected a valid tier automatically from the document,
  // we instantly unlock the drafting phase. No more manual deadlocks.
  if (data.detectedLevel) {
    return { verified: true, errors: [] };
  }

  const errors = [];

  if (!data.theme || data.theme.trim() === '') {
    errors.push('Topic Alignment: You must confirm or identify a central theme for your work.');
  }

  if (!data.evidenceFormula || data.evidenceFormula.length === 0) {
    errors.push('Source Audit: No evidence constraints detected. Please re-upload your assessment brief.');
  }

  if (!data.formattingConfirmed) {
    errors.push('Formatting Check: You must confirm that you are prepared to provide proper referencing.');
  }

  if (errors.length > 0) {
    return { verified: false, errors };
  }

  return { verified: true, errors: [] };
};
