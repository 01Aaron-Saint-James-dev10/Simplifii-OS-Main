import React from 'react';
import { X, Upload, CheckCircle2, Lightbulb, Link2 } from 'lucide-react';

const EXPLAINERS = {
  'Brief Simplifier': {
    what: "Can't figure out what your lecturer actually wants? Upload your assessment brief and get plain language instructions, a week-by-week action plan, every deadline clearly mapped, key terms explained, and the exact steps to complete your assessment. Reads any university's document format.",
    input: "Upload your assessment brief PDF — the document your lecturer gave you explaining what you need to do.",
    getBack: ['Plain language summary of requirements', 'Step-by-step workflow', 'Key dates and deadlines', 'Important terms explained', 'Common mistakes to avoid'],
    bestWhen: ["You've read the brief three times and still don't know where to start", "You want to make sure you haven't missed any hidden requirements", "You need a clear checklist to follow"],
    worksWith: 'Use Brief Simplifier first, then Rubric Simplifier to understand the marking criteria, then Scaffolder to plan your structure.'
  },
  'Rubric Simplifier': {
    what: "Don't know what a Distinction actually looks like in practice? Upload your marking rubric and get a point-by-point breakdown of exactly what earns every mark. See the difference between HD and Credit work spelled out clearly — no more guessing what your marker wants.",
    input: 'Upload your rubric or marking criteria PDF, or paste the rubric text directly.',
    getBack: ['Per-criterion breakdowns with grade level guides', 'Micro-task checklists for each criterion', 'Self-assessment checklist', 'Plain English summaries'],
    bestWhen: ["You want to know what distinction-level work actually looks like", "The rubric uses academic language you don't fully understand", "You want a clear checklist to tick off before submitting"],
    worksWith: 'Use after Brief Simplifier. Then use Essay Scorer to check your draft against these criteria.'
  },
  'Essay Scorer': {
    what: "Written a draft but not sure if it's good enough to submit? Upload your draft essay and rubric and get honest, rubric-aligned feedback before you submit. See exactly which criteria you're meeting, what evidence from your own writing supports each score, and the single most impactful change to make before submission.",
    input: 'Paste your draft essay and optionally your rubric text.',
    getBack: ['Per-criterion scores with evidence from your writing', 'Specific improvement suggestions', 'Strongest aspects highlighted', 'Band-by-band breakdown'],
    bestWhen: ["You've written a draft and want to know how to improve it", "You want to check your work against the rubric before submitting", "You're not sure if you've addressed all the criteria"],
    worksWith: 'Use after Rubric Simplifier. Then use Humaniser to polish your final draft.'
  },
  'Humaniser': {
    what: 'Does your writing feel stiff or keep getting flagged by AI detectors? Paste your writing and get back your authentic voice — every idea exactly as you wrote it, expressed more naturally. Includes a before/after AI detection risk score so you can see the difference.',
    input: 'Paste your written text directly.',
    getBack: ['Adjusted version with your ideas intact', 'Before/after AI detection risk scores', 'Change-by-change explanation table', 'Voice reflection questions'],
    bestWhen: ["Your writing feels stiff or formulaic", "You're worried about AI detection flags", "You want your personality to show in academic writing"],
    worksWith: 'Use after Essay Scorer for a final polish. Then use Brief Simplifier for your next assessment.'
  },
  'Assessment Scaffolder': {
    what: "Staring at a blank page and don't know where to start? Tell us your assessment type, topic, and word count and get a complete section-by-section writing blueprint. Every section has an exact word count, starter sentence, specific questions to answer, and what separates HD from Credit work. Based on Bloom's Taxonomy.",
    input: 'Enter your assessment type, topic, word count, and year level.',
    getBack: ['Section-by-section structure', 'Word count allocations that sum to your target', 'Key questions to answer in each section', 'Success tips'],
    bestWhen: ["You're staring at a blank page", "You know what to write about but not how to structure it", "You want to make sure your word count is allocated properly"],
    worksWith: 'Use after Brief Simplifier. Then use Essay Scorer to check your draft.'
  },
  'Course Planner': {
    what: "Got assessments across three courses and no idea what to tackle first? Upload all your course outlines and assessment documents and get one clear semester-wide plan. Week-by-week priorities, deadline tracker, and study time estimates — all in one place.",
    input: 'Upload all your course outlines and assessment documents.',
    getBack: ['Week-by-week plan', 'Priority ordering', 'Deadline tracker', 'Study plan with Pomodoro sessions'],
    bestWhen: ["You want to see everything in one place", "You keep missing deadlines", "Start of semester and you want to plan ahead"],
    worksWith: 'Use this first at the start of semester. Then use each tool as assessments come up.'
  },
  'Hidden Curriculum Decoder': {
    what: "Feel like everyone else knows something you were never told? Upload any academic document and get the unwritten rules decoded. What your marker actually wants but never says. The academic language that signals competence. The hidden expectations that separate passing from distinction work.",
    input: 'Paste any academic document — brief, rubric, or course outline.',
    getBack: ['Jargon decoded into plain English', 'Hidden expectations revealed', 'Academic language guide', 'Belonging affirmation'],
    bestWhen: ["You feel like everyone else knows something you were never told", "Academic language feels like a foreign language", "You're first in your family at university"],
    worksWith: 'Use alongside Brief Simplifier. Then use Scaffolder to plan your structure.'
  },
  'Concept Visualiser': {
    what: "Read the textbook three times and still don't get it? Type any concept and get it explained simply first, then accurately, then connected to your coursework. Uses the Feynman Technique — the method used by the world's best teachers.",
    input: 'Type any concept or topic you need to understand.',
    getBack: ['Simple explanation anyone could follow', 'Where the simple version breaks down', 'Accurate version with nuance', 'Thinking questions to deepen understanding'],
    bestWhen: ["You've read the textbook and still don't understand it", "You need to explain a concept in your own words", "You want to check if you truly understand something"],
    worksWith: 'Use alongside Hidden Curriculum Decoder for full understanding.'
  },
  'Executive Function Planner': {
    what: "Know what you need to do but can't make yourself start? Break your assessment tasks into timed focus sessions with a built-in Pomodoro timer. ADHD Sprint mode available (15/3). Designed specifically for students with executive function challenges.",
    input: 'Add your tasks with time estimates.',
    getBack: ['Task checklist with priorities', 'Built-in Pomodoro timer', 'Focus session management', 'Progress tracking'],
    bestWhen: ["You know what to do but can't get started", "You lose focus after 10 minutes", "You need external structure to stay on track"],
    worksWith: 'Use after Course Planner to break down your weekly tasks. Then use Scaffolder for writing structure.'
  },
};

const ToolExplainerModal = ({ open, onClose, toolName }) => {
  if (!open || !toolName) return null;
  const info = EXPLAINERS[toolName];
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="tool-explainer-modal">
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{toolName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">What this tool does</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{info.what}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Upload size={12} /> What to upload or enter</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{info.input}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={12} /> What you get back</h4>
            <ul className="space-y-1">
              {info.getBack.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-emerald-400 mt-0.5">+</span> {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Lightbulb size={12} /> Best used when...</h4>
            <ul className="space-y-1">
              {info.bestWhen.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-gray-500">-</span> {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Link2 size={12} /> Works well with</h4>
            <p className="text-sm text-gray-400 leading-relaxed">{info.worksWith}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolExplainerModal;
