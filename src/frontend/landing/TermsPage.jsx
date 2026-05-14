import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE, SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

export default function TermsPage() {
  return (
    <div style={s.root}>
      <article style={s.card}>
        <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>

        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.updated}>Last updated: 14 May 2026</p>

        <Section title="Welcome to Simplifii-OS">
          <P>These terms govern your use of Simplifii-OS, a workflow tool built and operated by Simplifii Pty Ltd (ACN 696 711 887), a company registered in New South Wales, Australia. Our registered office is at 3A Oak Street, Blackwall NSW 2256.</P>
          <P>By creating an account or using Simplifii-OS, you agree to these terms. If you do not agree, please do not use the service.</P>
          <P>We have tried to write these terms in plain English. Where legal language is necessary, we have kept it as short as possible.</P>
        </Section>

        <Section title="What Simplifii-OS is">
          <P>Simplifii-OS is a workflow layer that helps students, researchers, and other learners prepare for, organise, decide on, and follow through with their work. It is designed to support thinking rather than replace it. We do not generate completed assignments on your behalf. We help you build your own work, in your own voice, against sources you have verified.</P>
          <P>The service is currently in beta. This means some features may change, break, or be removed as we learn from how people use it. We will tell you about significant changes.</P>
        </Section>

        <Section title="Your account">
          <P>You must provide accurate information when you create an account. You are responsible for keeping your password and authentication details secure.</P>
          <P>You must be at least 13 years old to use Simplifii-OS. If you are between 13 and 17, you should review these terms with a parent, carer, or trusted adult before signing up.</P>
          <P>You may have only one account at a time. You may not share your account with others. You may not use someone else's account without their permission.</P>
          <P>If we suspect your account has been compromised, we may suspend it temporarily and contact you to verify.</P>
        </Section>

        <Section title="Acceptable use">
          <P>You agree to use Simplifii-OS only for lawful purposes and only in ways that do not infringe the rights of, restrict, or inhibit anyone else's use of the service.</P>
          <P>You agree not to:</P>
          <P>Use Simplifii-OS to produce or distribute work that is illegal, defamatory, harassing, discriminatory, or that incites violence.</P>
          <P>Use Simplifii-OS to submit work as your own when it is not. We provide tools that support your thinking. Submitting AI-generated content as your own work in an academic context is academic misconduct in most institutions. You are responsible for understanding and following your institution's academic integrity policies.</P>
          <P>Upload content that infringes copyright, intellectual property rights, or any other legal rights of a third party, unless you have a clear legal basis to do so (for example, fair dealing for research and study under Australian copyright law).</P>
          <P>Attempt to reverse engineer, scrape, or otherwise circumvent the technical protections of the service.</P>
          <P>Use automated tools to create accounts, send requests, or extract data from Simplifii-OS without our written permission.</P>
          <P>Use Simplifii-OS to attempt to harm or disrupt other users, our infrastructure, or third parties.</P>
          <P>We may suspend or terminate accounts that breach this section, with or without notice depending on the severity.</P>
        </Section>

        <Section title="Your content">
          <P>You retain ownership of the documents, drafts, notes, citations, and any other content you upload or create using Simplifii-OS. We do not claim ownership over your work.</P>
          <P>By using Simplifii-OS, you grant us a limited licence to store, process, and display your content solely for the purpose of providing the service to you. This licence ends when you delete your content or your account, except where we are legally required to retain a copy.</P>
          <P>We do not use your private content to train artificial intelligence models. We do not share your content with advertisers. We do not sell your content. Ever.</P>
          <P>You are responsible for ensuring you have the rights to upload any content you put into Simplifii-OS. If you upload someone else's work (for example, a journal article), you are responsible for ensuring you are entitled to use it for your stated purpose under copyright law.</P>
        </Section>

        {/* STRENGTHENED Section 5 from AI_DISCLAIMER_FRAMEWORK.md Layer 4 */}
        <Section title="Academic integrity and educational use">
          <P>Simplifii-OS is an academic support tool. It is designed to strengthen your thinking, your voice, and your engagement with your work. It is not designed for, and you agree not to use it for, the following:</P>
          <Ul>
            <Li>Submitting AI-generated content as if it were your own original work, where your institution forbids this.</Li>
            <Li>Bypassing or evading your institution's academic integrity, plagiarism, or AI-disclosure policies.</Li>
            <Li>Producing work for a third party who will submit it as their own.</Li>
            <Li>Generating false citations, fabricated sources, or fake research to deceive a marker, reviewer, or examiner.</Li>
          </Ul>
          <P>You agree that:</P>
          <P>You will read and understand your institution's policies on AI-assisted work before submitting anything created with Simplifii-OS.</P>
          <P>You will disclose your use of AI-assisted tools where your institution requires it.</P>
          <P>You will not rely on Simplifii-OS's outputs without your own independent review.</P>
          <P>You accept full responsibility for any consequences (academic penalty, failed assessment, suspension, expulsion, professional disciplinary action) arising from your submission of work to your institution. Simplifii-OS is a tool. You decide how to use it. The consequences of how you use it are yours.</P>
        </Section>

        <Section title="Service availability">
          <P>We aim to keep Simplifii-OS available at all times. We cannot guarantee uninterrupted access. Maintenance, bugs, infrastructure issues, and third-party service outages may cause temporary disruption.</P>
          <P>During beta, the service is provided as-is. We may add, change, or remove features at any time. We will give reasonable notice for major changes where possible.</P>
        </Section>

        <Section title="Pricing and payment">
          <P>Simplifii-OS is free to use during the beta period.</P>
          <P>If we introduce paid plans in the future, you will be notified before any charges apply. Free accounts will continue to have a free tier of some form. We will not retroactively charge you for use during the beta.</P>
        </Section>

        <Section title="Termination">
          <P>You can delete your account at any time. We will remove your personal information from active systems within 30 days, as described in our <Link to="/privacy" style={s.link}>Privacy Policy</Link>.</P>
          <P>We may suspend or terminate your account if you breach these terms, if we are required to do so by law, or if we shut down the service entirely. Where possible, we will give reasonable notice.</P>
          <P>If we terminate your account for a reason other than your breach of these terms, we will give you the opportunity to export your data first.</P>
        </Section>

        {/* STRENGTHENED Section 9 from AI_DISCLAIMER_FRAMEWORK.md Layer 4 */}
        <Section title="Disclaimers and limitation of liability">
          <H3>9.1 No guarantee of accuracy</H3>
          <P>Simplifii-OS uses artificial intelligence to provide suggestions, summaries, interpretations, and verification prompts. AI systems can be incomplete, incorrect, biased, or out of date. We do not warrant that:</P>
          <Ul>
            <Li>Any information produced or surfaced by Simplifii-OS is accurate, current, complete, or fit for any particular purpose.</Li>
            <Li>Any rubric or brief translation reflects your teacher's, marker's, or institution's actual expectations.</Li>
            <Li>Any citation verification will identify all errors, hallucinations, or misattributions.</Li>
            <Li>Any wellness, productivity, or focus feature will improve your performance, focus, or wellbeing.</Li>
          </Ul>
          <P>You must independently verify all important information before relying on it.</P>

          <H3>9.2 No guarantee of academic outcomes</H3>
          <P>Simplifii-OS does not promise, guarantee, predict, or warrant:</P>
          <Ul>
            <Li>Any specific grade, mark, score, or academic outcome.</Li>
            <Li>That your work will pass any assessment, satisfy any rubric, or meet any marker's standards.</Li>
            <Li>That your submission will not be flagged by AI-detection tools, plagiarism software, or academic integrity processes.</Li>
            <Li>That your use of Simplifii-OS will be permitted by your institution.</Li>
          </Ul>
          <P>Your grades depend on your thinking, your effort, your teacher's judgment, your institution's standards, and many other factors outside our control.</P>

          <H3>9.3 No professional advice</H3>
          <P>Simplifii-OS is not, and does not provide:</P>
          <Ul>
            <Li>Legal advice.</Li>
            <Li>Medical or mental health advice or treatment.</Li>
            <Li>Financial, tax, or accounting advice.</Li>
            <Li>Career, immigration, or visa advice.</Li>
            <Li>Therapy, counselling, or crisis intervention.</Li>
          </Ul>
          <P>If you need professional advice on any of these matters, please consult a qualified professional.</P>
          <P>If you are experiencing a mental health crisis, please contact emergency services (000 in Australia), Lifeline (13 11 14), or a trusted health provider immediately.</P>

          <H3>9.4 Limitation of liability</H3>
          <P>To the maximum extent permitted by law, Simplifii Pty Ltd, its directors, employees, contractors, and service providers are not liable to you or any third party for:</P>
          <Ul>
            <Li>Any loss of marks, grades, academic standing, scholarships, or educational opportunities.</Li>
            <Li>Any disciplinary action taken by an educational institution against you.</Li>
            <Li>Any loss of work, content, or data, including where caused by our service providers (such as Supabase or Vercel) or by your own actions.</Li>
            <Li>Any indirect, incidental, consequential, special, or punitive damages.</Li>
            <Li>Any reliance you place on AI-generated content within Simplifii-OS.</Li>
          </Ul>
          <P>Our total aggregate liability to you, for all claims arising from your use of Simplifii-OS, is limited to the greater of: (a) the amount you have paid us for the service in the 12 months preceding the claim, or (b) 100 Australian dollars.</P>
          <P>Nothing in this section excludes or limits any liability that cannot be excluded or limited under Australian Consumer Law, including the Competition and Consumer Act 2010 (Cth). Where Australian Consumer Law applies, our liability is limited to the maximum extent permitted by that law.</P>
        </Section>

        <Section title="Privacy">
          <P>How we handle your personal information is set out in our <Link to="/privacy" style={s.link}>Privacy Policy</Link>. By using Simplifii-OS, you confirm you have read and understood that policy.</P>
        </Section>

        <Section title="Changes to these terms">
          <P>We may update these terms from time to time. When we make significant changes, we will notify you through the app or by email. The "last updated" date at the top of this page will always show when these terms were last revised.</P>
          <P>If you continue to use Simplifii-OS after we have notified you of changes, you accept the updated terms. If you do not agree, you may delete your account.</P>
        </Section>

        <Section title="Governing law">
          <P>These terms are governed by the laws of New South Wales, Australia. You and Simplifii Pty Ltd agree to submit to the exclusive jurisdiction of the courts of New South Wales for any disputes arising from these terms or your use of Simplifii-OS.</P>
          <P>This does not affect any consumer rights you have that cannot be limited or excluded by Australian law.</P>
        </Section>

        <Section title="Contact">
          <P>For questions about these terms, contact:</P>
          <P>
            Aaron Saint-James<br />
            Founder, Simplifii Pty Ltd<br />
            Email: <a href="mailto:aaron@simplifii.com.au" style={s.link}>aaron@simplifii.com.au</a><br />
            Postal: 3A Oak Street, Blackwall NSW 2256, Australia
          </P>
        </Section>

        <div style={{ marginTop: 32 }}>
          <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={s.h2}>{title}</h2>
      {children}
    </section>
  );
}

function H3({ children }) {
  return <h3 style={s.h3}>{children}</h3>;
}

function P({ children }) {
  return <p style={s.body}>{children}</p>;
}

function Ul({ children }) {
  return <ul style={s.ul}>{children}</ul>;
}

function Li({ children }) {
  return <li style={s.li}>{children}</li>;
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    background: SURFACE_BASE,
    padding: '48px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 720,
  },
  backLink: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: 24,
  },
  h1: {
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: 32,
    margin: '0 0 4px',
  },
  h2: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 18,
    margin: '0 0 10px',
  },
  h3: {
    fontFamily: FONT_BODY,
    fontWeight: 600,
    fontSize: 15,
    margin: '16px 0 6px',
  },
  updated: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    letterSpacing: '0.06em',
    margin: '0 0 36px',
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 12px',
  },
  ul: {
    margin: '0 0 12px',
    paddingLeft: 20,
  },
  li: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 6,
  },
  link: {
    textDecoration: 'underline',
  },
};
