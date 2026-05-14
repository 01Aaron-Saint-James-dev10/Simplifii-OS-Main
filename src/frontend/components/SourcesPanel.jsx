/**
 * SourcesPanel
 *
 * Right panel: Sources tab.
 * Wraps CitationManager (corpus management) and hosts the CitationInserter
 * modal so inserts dispatch cleanly from within the panel.
 *
 * Props:
 *   courseId - string
 */

import React, { useState } from 'react';
import CitationManager from './CitationManager';
import CitationInserter from './CitationInserter';

export default function SourcesPanel({ courseId }) {
  const [inserterOpen, setInserterOpen] = useState(false);
  const [inserterSource, setInserterSource] = useState(null);

  function handleRequestInsert(source) {
    setInserterSource(source);
    setInserterOpen(true);
  }

  function handleClose() {
    setInserterOpen(false);
    setInserterSource(null);
  }

  return (
    <>
      <CitationManager courseId={courseId} onRequestInsert={handleRequestInsert} />
      <CitationInserter
        isOpen={inserterOpen}
        onClose={handleClose}
        initialSource={inserterSource}
      />
    </>
  );
}
