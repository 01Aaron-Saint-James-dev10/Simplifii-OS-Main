/* global React, ReactDOM */
const { useState, useEffect, useCallback } = React;

function App() {
  const { PILLARS, SOURCE_DOCS, STARTER_DRAFTS, AURA_INITIAL } = window.SIMPLIFII_DATA;

  const [activePillarId, setActivePillarId] = useState("lit-review");
  const [activeDocId, setActiveDocId] = useState("brief");
  const [activeBlockId, setActiveBlockId] = useState("foundation");

  // drafts keyed by pillarId.blockId
  const [drafts, setDrafts] = useState(() => {
    const out = {};
    for (const p of PILLARS) {
      out[p.id] = {};
      const starter = STARTER_DRAFTS[p.id] || {};
      for (const b of p.blocks) {
        out[p.id][b.id] = starter[b.id] || "";
      }
    }
    return out;
  });

  const pillar = PILLARS.find((p) => p.id === activePillarId);
  const pillarDrafts = drafts[activePillarId];

  const setDraft = (blockId, val) => {
    setDrafts((prev) => ({
      ...prev,
      [activePillarId]: { ...prev[activePillarId], [blockId]: val }
    }));
  };

  // When pillar swaps, reset active block to first
  useEffect(() => {
    if (pillar && pillar.blocks.length) setActiveBlockId(pillar.blocks[0].id);
  }, [activePillarId]);

  // External pillar pick (from roadmap stops)
  useEffect(() => {
    const h = (e) => setActivePillarId(e.detail);
    window.addEventListener("simplifii:pickPillar", h);
    return () => window.removeEventListener("simplifii:pickPillar", h);
  }, []);

  // ---- AURA chat ----
  const [messages, setMessages] = useState(AURA_INITIAL);
  const [chatDraft, setChatDraft] = useState("");

  const sendChat = useCallback((text) => {
    setMessages((m) => [...m, { role: "user", text }]);
    // canned grounded reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "aura",
          text: "Reading that against your sources. The Brief is explicit: it wants you to flag where the field disagrees, not just summarise. Try locating one disagreement per pillar before you push into Core. I can pull three candidate disagreements from the Outline if that helps.",
          cites: [
            { label: "Brief p.2", doc: "brief" },
            { label: "Outline p.9", doc: "outline" }
          ]
        }
      ]);
    }, 700);
  }, []);

  return (
    <div className="studio">
      <NavRail />
      <SourcesPanel
        docs={SOURCE_DOCS}
        pillars={PILLARS}
        activePillar={activePillarId}
        activeDoc={activeDocId}
        onPickPillar={setActivePillarId}
        onPickDoc={setActiveDocId}
      />
      <Cockpit
        pillar={pillar}
        drafts={pillarDrafts}
        setDraft={setDraft}
        activeBlockId={activeBlockId}
        setActiveBlockId={setActiveBlockId}
      />
      <AuraPanel
        messages={messages}
        onSend={sendChat}
        draft={chatDraft}
        setDraft={setChatDraft}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
