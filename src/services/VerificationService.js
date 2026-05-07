export const auditProjectContext = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const errors = [];
  const validThemes = ['molecules', 'cells', 'genes'];

  if (!data.theme || !validThemes.includes(data.theme.toLowerCase())) {
    errors.push('Topic Alignment: Your topic must be centered on molecules, cells, or genes.');
  }

  if (!data.articles || data.articles.length < 3) {
    errors.push('Source Audit: You must identify exactly three peer-reviewed scientific articles (two primary, one review).');
  } else {
    const filledArticles = data.articles.filter(a => a.trim().length > 0);
    if (filledArticles.length < 3) {
      errors.push('Source Audit: Please provide the titles or URLs for all 3 required articles.');
    }
  }

  if (!data.formattingConfirmed) {
    errors.push('Formatting Check: You must confirm that you are prepared to provide proper referencing.');
  }

  if (errors.length > 0) {
    return { verified: false, errors };
  }

  return { verified: true, errors: [] };
};
