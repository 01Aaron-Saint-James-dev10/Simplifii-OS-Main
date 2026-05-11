import React, { useState, useCallback } from 'react';
import { uploadPdf } from '../lib/storage';

export default function PdfDropZone() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setStatus('error');
      setMessage('Only PDF files are accepted.');
      return;
    }
    setStatus('uploading');
    setMessage(`Uploading ${file.name}...`);
    const { path, error } = await uploadPdf(file);
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Upload failed.');
    } else {
      setStatus('success');
      setMessage(`Uploaded to ${path}`);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleSelect = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const borderClass =
    status === 'success' ? 'border-emerald-500'
    : status === 'error' ? 'border-rose-500'
    : status === 'uploading' ? 'border-amber-500'
    : isDragOver ? 'border-indigo-400'
    : 'border-zinc-700';

  const messageClass =
    status === 'error' ? 'text-rose-400'
    : status === 'success' ? 'text-emerald-400'
    : status === 'uploading' ? 'text-amber-400'
    : 'text-zinc-400';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mx-4 my-3 p-5 border-2 border-dashed rounded-lg ${borderClass} bg-zinc-900/40 text-center transition-colors`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
        PDF Upload (Block 3 scaffold)
      </p>
      <p className="text-xs text-zinc-500 mb-3">
        Drop a PDF here, or use the file picker below. Anonymous upload to Supabase Storage.
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleSelect}
        className="text-xs text-zinc-400"
      />
      {message && (
        <p className={`mt-3 text-xs ${messageClass}`}>
          {message}
        </p>
      )}
    </div>
  );
}
