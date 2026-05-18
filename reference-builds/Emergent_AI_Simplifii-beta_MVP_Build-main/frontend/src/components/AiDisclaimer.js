import React from 'react';

const AiDisclaimer = () => (
  <div className="mt-10 pt-6 border-t border-white/[0.04]" data-testid="ai-disclaimer">
    <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl">
      Simplifii-&#946; uses AI to transform documents into accessible, structured outputs.
      All outputs support your thinking &mdash; they do not replace it. Always verify with your course materials.
    </p>
    <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl mt-2">
      Outputs are neuroinclusive, UDL 3.0 aligned, and strengths-based.
      Not a substitute for professional academic advice.
    </p>
  </div>
);

export default AiDisclaimer;
