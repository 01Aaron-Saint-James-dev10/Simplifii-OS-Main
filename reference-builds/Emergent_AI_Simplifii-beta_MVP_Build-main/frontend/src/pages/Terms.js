import React from 'react';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';

const Terms = () => (
  <div className="min-h-screen bg-[#09090B]">
    <Navigation />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Outfit' }} data-testid="terms-title">Terms of Service</h1>
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <p className="text-zinc-500">Last updated: April 2026</p>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>What Simplifii Is</h2>
          <p>Simplifii is an AI-assisted study tool designed to help university students understand their assessments, plan their work, and improve their academic writing. It uses artificial intelligence to translate academic language, scaffold assignments, score drafts, and provide formative feedback.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>What Simplifii Is Not</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Simplifii is <strong className="text-zinc-300">not academic advice</strong>. It does not replace your lecturer, tutor, or university support services.</li>
            <li>Simplifii <strong className="text-zinc-300">does not guarantee grades</strong>. Scores provided are AI-generated estimates for formative guidance only.</li>
            <li>Simplifii is <strong className="text-zinc-300">not a substitute for professional help</strong>. If you are experiencing mental health challenges, please contact your university's student support services.</li>
            <li>Simplifii <strong className="text-zinc-300">does not write essays or complete assessments</strong> for you. All tools provide guidance, structure, and feedback — the work remains yours.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Academic Integrity</h2>
          <p>You are responsible for your own academic work. Simplifii is designed to support your learning, not to circumvent academic integrity policies. You should:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Declare any AI assistance as required by your university's academic integrity policy.</li>
            <li>Use Simplifii outputs as <strong className="text-zinc-300">guidance and scaffolding</strong>, not as submissions.</li>
            <li>Ensure all submitted work represents your own thinking, analysis, and argumentation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Tickets and Refund Policy</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Tickets are <strong className="text-zinc-300">non-refundable once used</strong>. Each tool use deducts the displayed ticket cost.</li>
            <li>Unused tickets remain in your account and do not expire.</li>
            <li>If a tool fails to produce output due to a system error and your tickets were deducted, contact us for a ticket credit.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Fair Use</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>No automated scraping, bot access, or programmatic use of Simplifii tools.</li>
            <li>No reselling, redistributing, or commercially exploiting Simplifii outputs.</li>
            <li>No uploading malicious, illegal, or non-academic content.</li>
            <li>We reserve the right to suspend accounts that violate fair use.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Australian Consumer Law</h2>
          <p>Nothing in these terms excludes, restricts, or modifies any right or remedy you may have under the <strong className="text-zinc-300">Australian Consumer Law</strong> (Schedule 2 of the Competition and Consumer Act 2010). Where our liability cannot be excluded, it is limited to the re-supply of the service or the cost of having the service re-supplied.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Simplifii and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to academic outcomes, grades, or employment decisions.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Contact</h2>
          <p>For questions about these terms:</p>
          <p className="mt-1"><a href="mailto:simplifii.contact@gmail.com" className="text-emerald-400 hover:underline">simplifii.contact@gmail.com</a></p>
        </section>

        <div className="pt-4 border-t border-white/[0.06]">
          <Link to="/privacy" className="text-emerald-400 hover:underline text-sm">View Privacy Policy</Link>
        </div>
      </div>
    </div>
  </div>
);

export default Terms;
