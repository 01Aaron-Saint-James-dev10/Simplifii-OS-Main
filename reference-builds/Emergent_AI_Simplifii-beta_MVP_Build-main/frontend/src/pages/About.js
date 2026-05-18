import React from 'react';
import Navigation from '../components/Navigation';
import { Mail, Globe, Microscope } from 'lucide-react';

const Section = ({ children }) => (
  <div className="border-t border-[#00e5ff]/10 pt-10 mt-10">{children}</div>
);

const About = () => (
  <div className="min-h-screen bg-[#080b0f]">
    <Navigation />
    <div className="max-w-3xl mx-auto px-6 py-16" style={{ lineHeight: 1.8 }}>

      {/* Photo + Title */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-[120px] h-[120px] rounded-full border-2 border-[#00e5ff] overflow-hidden bg-[#0d1117] flex items-center justify-center mb-4" data-testid="about-photo">
          <img
            src="/aaron-headshot.jpeg"
            alt="Aaron Saint-James, Founder of Simplifii"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <span className="text-3xl text-[#00e5ff] font-bold hidden items-center justify-center w-full h-full" style={{ fontFamily: 'Outfit' }}>AS</span>
        </div>
        <p className="text-xs text-zinc-500">Aaron Saint-James, Founder</p>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#00e5ff] text-center mb-4" style={{ fontFamily: 'Outfit' }} data-testid="about-heading">
        Built for complex briefs.<br />Not complex brains.
      </h1>

      <Section>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I'm Aaron Saint-James.<br />I built Simplifii because I needed it.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I have ADHD, dyslexia, C-PTSD, chronic anxiety, depression, and chronic fatigue. I've sat in university lectures genuinely trying my hardest and still walked out not knowing what I was supposed to do next. I've read assessment briefs four times and still felt like everyone else got a memo I never received.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">I wasn't struggling because I wasn't smart enough.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I was struggling because university was designed for a specific kind of student — and I wasn't that student.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">For a long time, I didn't think I'd ever get a degree. Not because I didn't want one. Not because I wasn't capable. But because the system wasn't built for a brain like mine.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I'm now completing my Master of Research. I'm going into a PhD next year.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">I never thought that was possible.<br />I want to make it possible for you too.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>What nobody tells you</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">University has a hidden curriculum. An unwritten set of rules about how to write, how to think, how to present your ideas, what markers actually want, and how to navigate systems that were built for someone else.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">Students who grew up in university-educated households absorbed these rules passively — at the dinner table, through family conversations, through years of quiet preparation. Students who didn't arrive on day one wondering why they feel two steps behind everyone else.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">Nobody tells you that the gap isn't about intelligence. It's about access.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">That gap — between what universities assume you know and what they actually teach you — is where students fall through.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">It's where I fell through. Repeatedly.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I never had a helping hand when I was younger. That's exactly what I want to give you — as everyone deserves this.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>I've been in your shoes</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I know what it feels like to sit with a 2,000-word essay due in a week and not know where to start. I know what it feels like to re-read a rubric and still not understand what an HD actually looks like in practice. I know what it feels like to walk into a support service and leave feeling more lost than when you arrived.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">University support, at its best, is limited. At its worst, it's invisible.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">I never want another student to struggle the way I did. I never want another student to fail a course or abandon a degree because the system failed to meet them where they are.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">That is my life's mission.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>Why I built this</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I'm a researcher, an educator, and the co-founder of the Diversified Project at UNSW — a disability innovation initiative reimagining what neuroinclusion looks like in higher education. I'm a member of the Remarkable Accelerator, Australia's leading disability-inclusive technology program.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I've spent years studying Universal Design for Learning (UDL3.0) and thinking about what accessibility actually means — not just technically compliant, but genuinely useful for the students who need it most.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">Simplifii is the product I wish had existed when I was sitting in my first year not knowing where to start.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">Every tool is built on one principle: the problem was never the student. The problem was a system that assumed everyone arrives the same.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>Who Simplifii is for</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">Simplifii was built for neurodivergent students. For first-generation university students. For international students navigating a new academic culture. For mature-aged students returning after years away. For students from low-SES backgrounds who never had access to tutors or academic coaching. For anyone who has ever felt like they were on the outside of something they were never properly let into.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">You don't need to identify as disabled or neurodivergent to use Simplifii.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">You just need to have ever read an assessment brief and not known where to start.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>What I believe</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I believe that anyone — regardless of class, race, culture, socioeconomic background, neurotype, or life circumstance — deserves to go to university, start a business, build something meaningful, and succeed beyond what they ever thought was possible.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I never thought I'd get a degree. I never thought I'd be doing a Master of Research. I never thought I'd be building technology that could change how students experience education.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6 font-semibold">Crazy what happens when someone removes the barriers.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">That's what Simplifii is here to do.</p>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold text-[#00e5ff] mb-6" style={{ fontFamily: 'Outfit' }}>Want to connect?</h2>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">If you're a student who needs support — I want to hear from you.<br />If you're an educator who wants to build more inclusive assessment practices — I want to hear from you.<br />If you're a builder who wants to help change the world — to make it more neuroinclusive and accessible so all people can not just survive university but succeed beyond their wildest dreams — I want to hear from you too.</p>
        <p className="text-[#e2eaf4] text-base leading-relaxed mb-6">I have many more AI and EdTech builds in progress. If you want to join me in making education genuinely work for everyone, reach out.</p>
        <div className="space-y-3 mt-6">
          <a href="mailto:simplifii.contact@gmail.com" className="flex items-center gap-3 text-[#00e5ff] hover:text-white transition-colors" data-testid="about-email">
            <Mail size={18} /> simplifii.contact@gmail.com
          </a>
          <a href="https://aaron-saint-james.com.au" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#00e5ff] hover:text-white transition-colors" data-testid="about-website">
            <Globe size={18} /> aaron-saint-james.com.au
          </a>
          <a href="https://www.unsw.edu.au/edi/diversity-inclusion/disability-inclusion/disability-innovation-institute/diversified" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#00e5ff] hover:text-white transition-colors" data-testid="about-diversified">
            <Microscope size={18} /> Diversified Project at UNSW
          </a>
        </div>
      </Section>

      {/* Footer card */}
      <div className="mt-16 p-6 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded-2xl text-center" data-testid="about-footer-card">
        <p className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Aaron Saint-James</p>
        <p className="text-sm text-zinc-300 mt-1">Founder, Simplifii</p>
        <p className="text-sm text-zinc-300">Co-founder, The Diversified Project at UNSW</p>
        <p className="text-sm text-zinc-400 mt-2">MRes Candidate | PhD Candidate 2027</p>
        <p className="text-sm text-zinc-400">Remarkable Accelerator Member</p>
        <p className="text-xs text-zinc-500 mt-2">Provisional Patent 2026902550</p>
      </div>
    </div>
  </div>
);

export default About;
