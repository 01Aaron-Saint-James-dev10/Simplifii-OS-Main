import { supabase } from './supabaseClient';

const BUCKET = 'documents';

function sanitiseFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadPdf(file) {
  const safeName = sanitiseFilename(file.name);
  const path = `anonymous/${Date.now()}_${safeName}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false
    });
  return { path: data?.path || path, error };
}
