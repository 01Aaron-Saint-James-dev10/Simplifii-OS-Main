import React from 'react';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';

/**
 * CognitiveArchive - Right Sidebar Panel
 * Per-course ghost asset store. Accepts drag-and-drop of URLs and text
 * snippets; persists them in IndexedDB via handleAddGhostAsset. Only
 * rendered at currentStage === 5 (the caller controls this condition).
 *
 * Props:
 *   isZenMode          {boolean}  hide content in Zen Mode
 *   rightSidebarClass  {string}   computed width classes from MasterDashboard
 *   isRightCollapsed   {boolean}  collapsed state
 *   setIsRightCollapsed {Function} toggle collapse
 *   globalGhostAssets  {Array}    all ghost assets across all courses
 *   activeCourseId     {string}   filter assets to the active course
 *   handleAddGhostAsset {Function} persist a new ghost asset
 */
export default function CognitiveArchive({
  isZenMode,
  rightSidebarClass,
  isRightCollapsed, setIsRightCollapsed,
  globalGhostAssets,
  activeCourseId,
  handleAddGhostAsset
}) {
  return (
    <aside className={`${rightSidebarClass} bg-black/80 backdrop-blur-xl border-l border-zinc-900 flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-50 relative overflow-hidden`}>
      {!isZenMode && (
        <button
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
          className="absolute -left-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-blue-500 transition-all"
        >
          {isRightCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      )}

      {isRightCollapsed && !isZenMode ? (
        <div className="flex flex-col items-center mt-5 space-y-8 pt-6">
          <Shield size={20} className="text-blue-500" />
        </div>
      ) : !isZenMode && (
        <>
          <div className="p-5 flex items-center gap-3 text-blue-500 whitespace-nowrap pt-8">
            <Shield size={24} className="shrink-0" />
            <h3 className="font-black tracking-widest uppercase text-sm">Cognitive Archive</h3>
          </div>
          <div
            className="flex-1 overflow-y-auto px-6 pb-6 whitespace-nowrap custom-scrollbar"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-1', 'ring-blue-500/40'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40');
              const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
              if (!textData) return;
              const isUrl = /^https?:\/\//.test(textData);
              const newAsset = {
                id: Date.now().toString(),
                blockId: 'archive',
                source: isUrl ? new URL(textData).hostname : textData.slice(0, 50),
                text: isUrl ? `Extracted Insight from ${new URL(textData).hostname}: pending semantic mapping.` : textData,
                author: 'Manual capture',
                year: new Date().getFullYear().toString(),
                isPrimary: false
              };
              handleAddGhostAsset(newAsset);
            }}
          >
            {(() => {
              const courseAssets = globalGhostAssets.filter(a => a.courseId === activeCourseId);
              if (courseAssets.length === 0) {
                return (
                  <div className="text-zinc-500 text-xs font-bold mt-10 px-2">
                    <p>No embedded assets for this course yet.</p>
                    <p className="mt-2 font-medium normal-case text-[11px] leading-relaxed text-zinc-600">Drag a research URL or text snippet directly here, or drop it on a section in the Canvas. Assets stay scoped to the active course.</p>
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {courseAssets.map(asset => (
                    <div key={asset.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl max-w-full">
                      <p className="text-[12px] font-black uppercase text-emerald-400 mb-2 truncate">{asset.blockId === 'archive' ? `Source: ${asset.source}` : `Block: ${asset.blockId}`}</p>
                      <p className="text-xs text-zinc-300 whitespace-normal line-clamp-3">{asset.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </aside>
  );
}
