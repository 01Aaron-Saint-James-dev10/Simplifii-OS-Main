import React from 'react';
import { Brain, Shield, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#07080D] text-white font-sans overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <header className="w-full flex justify-between items-center mb-24">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-glow-emerald"><Brain size={24} className="text-black" /></div>
            <span className="font-black text-2xl tracking-tighter">SIMPLIFII-OS</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm font-black tracking-widest uppercase"
          >
            Sign In
          </button>
        </header>

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-32 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
            Don't Just Write.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Prove You Learned.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            The world's first neuro-adaptive operating system that decodes your assessments and generates undeniable cryptographic proof of your cognitive effort.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-10 py-5 rounded-full bg-emerald-500 text-black font-black text-lg uppercase tracking-widest hover:shadow-glow-emerald-lg hover:bg-emerald-400 transition-all flex items-center gap-3 mx-auto group cursor-pointer"
          >
            Launch OS 
            <ArrowRight className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-emerald-500/50 hover:shadow-glow-emerald transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Brain size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-white">Neuro-Adaptive UI</h3>
            <p className="text-zinc-400 leading-relaxed font-medium">Layouts and typography that adapt instantly to ADHD, Dyslexia, and Autism. A workspace that fits your brain, not the other way around.</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-teal-500/50 hover:shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield size={28} className="text-teal-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-white">The Integrity Guard</h3>
            <p className="text-zinc-400 leading-relaxed font-medium">Secretly logs your drafting process to generate an unforgeable Certificate of Learning. Shield yourself from false AI-detection flags forever.</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-emerald-500/50 hover:shadow-glow-emerald transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-white">Brief Decoding</h3>
            <p className="text-zinc-400 leading-relaxed font-medium">Say goodbye to 40-page PDFs. We connect to your LMS to extract exactly what you need to do, chunked into actionable, step-by-step blocks.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
