import React from 'react';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';

const Privacy = () => (
  <div className="min-h-screen bg-[#09090B]">
    <Navigation />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Outfit' }} data-testid="privacy-title">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <p className="text-zinc-500">Last updated: April 2026</p>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>What Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-zinc-300">Account information:</strong> Your email address and name (via email/password or Google sign-in).</li>
            <li><strong className="text-zinc-300">Uploaded documents:</strong> Assessment briefs, rubrics, essays, and other PDFs you upload for processing. These are processed in real-time and not stored permanently on our servers.</li>
            <li><strong className="text-zinc-300">Usage data:</strong> Which tools you use, ticket balance, and timestamps. This helps us improve the product.</li>
            <li><strong className="text-zinc-300">Payment data:</strong> Processed securely via Stripe. We never see or store your full card number.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>How Your Data Is Stored</h2>
          <p>Your account data is stored in an encrypted database. Uploaded documents are processed transiently — they are sent to our AI service for analysis and are not retained after processing is complete.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>AI Processing Disclosure</h2>
          <p>When you use Simplifii tools, your text is sent to Anthropic's Claude API for processing. Anthropic does not use API inputs to train their models. Your academic content remains yours. We encourage you to review <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Anthropic's privacy policy</a> for more detail.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You can request deletion of your account and all associated data at any time.</li>
            <li>You can request a copy of the data we hold about you.</li>
            <li>You can withdraw consent for data processing (this may affect your ability to use the service).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Data Sharing</h2>
          <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is shared only with:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Anthropic (AI processing) — governed by their API terms</li>
            <li>Stripe (payment processing) — governed by Stripe's privacy policy</li>
            <li>Google (if you use Google sign-in) — limited to authentication</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Jurisdiction</h2>
          <p>This policy is governed by the <strong className="text-zinc-300">Australian Privacy Act 1988</strong> and the Australian Privacy Principles (APPs). If you are located outside Australia, you acknowledge that your data may be transferred to and processed in Australia.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Contact</h2>
          <p>For privacy enquiries, data deletion requests, or complaints:</p>
          <p className="mt-1"><a href="mailto:simplifii.contact@gmail.com" className="text-emerald-400 hover:underline">simplifii.contact@gmail.com</a></p>
        </section>

        <div className="pt-4 border-t border-white/[0.06]">
          <Link to="/terms" className="text-emerald-400 hover:underline text-sm">View Terms of Service</Link>
        </div>
      </div>
    </div>
  </div>
);

export default Privacy;
