import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Upload, FileText, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const PdfUploadZone = ({ onTextExtracted, onFilesChanged, label, maxFiles = 10 }) => {
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const extractText = useCallback(async (fileList) => {
    if (fileList.length === 0) {
      onTextExtracted('');
      setExtracted(false);
      return;
    }
    setExtracting(true);
    setExtracted(false);
    setError('');
    try {
      const formData = new FormData();
      fileList.forEach(file => formData.append('files', file));
      const response = await axios.post(`${API}/pdf/extract-text`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.text) {
        onTextExtracted(response.data.text);
        setExtracted(true);
      } else {
        setError('No text could be extracted from the uploaded PDF(s).');
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setError('Failed to extract text. Please check the file is a valid PDF.');
    } finally {
      setExtracting(false);
    }
  }, [API, onTextExtracted]);

  const processFiles = useCallback((incoming) => {
    const pdfFiles = incoming.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length < incoming.length) {
      setError('Only PDF files are accepted.');
    }
    setFiles(prev => {
      const combined = [...prev, ...pdfFiles].slice(0, maxFiles);
      if (onFilesChanged) onFilesChanged(combined);
      extractText(combined);
      return combined;
    });
  }, [maxFiles, extractText, onFilesChanged]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;
    processFiles(selected);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (onFilesChanged) onFilesChanged(updated);
      if (updated.length > 0) {
        extractText(updated);
      } else {
        onTextExtracted('');
        setExtracted(false);
      }
      return updated;
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) processFiles(dropped);
  };

  const inputId = `pdf-upload-${useRef(Math.random().toString(36).substr(2, 6)).current}`;

  return (
    <div data-testid="pdf-upload-zone">
      <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
        {label || `Upload PDFs (up to ${maxFiles} files)`}
      </label>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 bg-[#09090B]/50 ${
          dragActive
            ? 'border-emerald-500/60 bg-emerald-500/[0.03]'
            : 'border-white/[0.08] hover:border-emerald-500/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
          data-testid="pdf-upload-input"
        />
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload size={32} className={`mx-auto mb-3 transition-colors ${dragActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
          <p className="text-zinc-300 font-medium mb-1 text-sm">
            {dragActive ? 'Drop your PDFs here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-zinc-600">
            PDF only{maxFiles > 1 ? ` \u00b7 Up to ${maxFiles} files` : ''}
            {files.length > 0 && ` \u00b7 ${files.length}/${maxFiles} uploaded`}
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-1.5" data-testid="pdf-file-list">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <FileText size={16} className="text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-zinc-300 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-zinc-600 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-0.5 hover:bg-white/[0.04] rounded text-zinc-500 hover:text-red-400 transition-colors"
                data-testid={`remove-file-${index}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {extracting && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg" data-testid="pdf-extracting">
          <Loader2 size={14} className="animate-spin text-violet-400" />
          <span className="text-sm text-violet-300">
            Extracting text from {files.length} PDF{files.length !== 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {extracted && !extracting && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg" data-testid="pdf-extracted">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-sm text-emerald-300">
            Text extracted from {files.length} file{files.length !== 1 ? 's' : ''} and filled below
          </span>
        </div>
      )}

      {error && !extracting && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-lg" data-testid="pdf-error">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}
    </div>
  );
};

export default PdfUploadZone;
