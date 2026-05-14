import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE, SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

export default function PrivacyPage() {
  return (
    <div style={s.root}>
      <article style={s.card}>
        <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>

        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: 14 May 2026</p>

        <Section title="Who we are">
          <P>Simplifii-OS is a workflow tool built by Simplifii Pty Ltd (ACN 696 711 887), a company registered in New South Wales, Australia. Our registered office is at 3A Oak Street, Blackwall NSW 2256.</P>
          <P>You can reach us at <Mailto /> with any privacy questions or requests.</P>
          <P>We are committed to handling your personal information in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles. Where applicable, we also aim to meet the requirements of the General Data Protection Regulation for users located in the European Union and United Kingdom.</P>
        </Section>

        <Section title="The plain version">
          <P>We collect the minimum information needed to make Simplifii-OS work for you. We do not sell your data. We do not show you ads. We do not train AI models on your private work. Your documents, drafts, and notes belong to you.</P>
          <P>The rest of this policy explains exactly what we collect and why, so you can decide whether you are comfortable using the service.</P>
        </Section>

        <Section title="What we collect">
          <P>When you sign up, we collect your email address and any name or display details you choose to provide. If you sign up using Google, we receive your name, email address, and Google profile photo from Google.</P>
          <P>When you use Simplifii-OS, we store the content you create or upload. This includes documents, drafts, notes, citations, research projects, and any files you choose to ingest. We also store technical information about your session, such as your device type, browser, approximate location based on your IP address, and timestamps of activity.</P>
          <P>We use Supabase as our authentication and database provider. Supabase stores your account credentials and your saved data on servers located in Sydney, Australia. We use Vercel to host the Simplifii-OS application. Vercel processes traffic and logs through global edge servers, which means some technical metadata may be processed outside Australia.</P>
          <P>We do not collect payment information at this stage because Simplifii-OS is free during beta. If we introduce paid plans, this policy will be updated and you will be notified.</P>
        </Section>

        <Section title="Why we collect it">
          <P>To create and maintain your account, including allowing you to log in, recover access, and sync your data across devices.</P>
          <P>To provide the core features of Simplifii-OS, such as saving your work, retrieving your citations, and supporting the verification and ingestion functionality.</P>
          <P>To improve the service. This means looking at aggregated, anonymised patterns of use to understand what works and what does not. We do not read individual users' documents to make product decisions.</P>
          <P>To communicate with you about important updates, security notices, and significant product changes. We will not send marketing emails without your clear consent.</P>
          <P>To meet our legal obligations under Australian and applicable international law.</P>
        </Section>

        <Section title="What we do not do">
          <P>We do not sell your personal information. To anyone. Ever.</P>
          <P>We do not use your private content (documents, drafts, notes, citations, ingested files) to train artificial intelligence models, ours or anyone else's.</P>
          <P>We do not show advertising inside Simplifii-OS. We do not share data with advertisers.</P>
          <P>We do not access your data unless one of the following applies: you have asked us to (for example, when you raise a support request), we are required to by law, or we have reason to believe there is a serious risk of harm to a person.</P>
        </Section>

        <Section title="Who we share data with">
          <P>We share data only with the small number of service providers needed to run Simplifii-OS. These are:</P>
          <P>Supabase, which provides authentication and database hosting. Supabase processes data on our behalf under their privacy policy.</P>
          <P>Vercel, which provides application hosting and content delivery. Vercel processes data on our behalf under their privacy policy.</P>
          <P>Google, only when you choose to sign in with a Google account. In that case, Google handles authentication. Google's privacy policy applies to that step.</P>
          <P>We do not share your data with third parties for marketing or advertising purposes.</P>
          <P>We may disclose information if required by Australian law, in response to a valid legal request, or to protect the rights, property, or safety of Simplifii-OS, our users, or the public.</P>
        </Section>

        <Section title="Where your data is stored">
          <P>Your account and content data are stored in Sydney, Australia, through Supabase's Australian region. Some technical and operational data, such as application logs and routing information, may be processed by Vercel through global infrastructure outside Australia. We take reasonable steps to ensure any overseas recipients handle your data in line with the Australian Privacy Principles.</P>
        </Section>

        <Section title="How long we keep your data">
          <P>We keep your data for as long as your account is active. If you delete your account, we delete your personal information from active systems within 30 days. Some information may remain in encrypted backups for up to 90 days before being permanently removed.</P>
          <P>We may retain limited information beyond this period if we are required to do so by law, or if we need it to resolve disputes or enforce our agreements.</P>
        </Section>

        <Section title="Your rights">
          <P>You have the right to:</P>
          <P>Access the personal information we hold about you.</P>
          <P>Correct any information that is inaccurate or out of date.</P>
          <P>Request deletion of your account and personal information.</P>
          <P>Export a copy of your data in a portable format.</P>
          <P>Withdraw consent for any optional processing you have agreed to.</P>
          <P>Lodge a complaint with the Office of the Australian Information Commissioner if you believe we have mishandled your information. Their website is www.oaic.gov.au.</P>
          <P>If you are located in the European Union or United Kingdom, you have additional rights under the General Data Protection Regulation, including the right to object to processing and the right to data portability.</P>
          <P>To exercise any of these rights, email <Mailto /> with the subject line "Privacy request". We aim to respond within 30 days.</P>
        </Section>

        <Section title="Security">
          <P>We use industry-standard security practices, including encrypted connections (HTTPS), encrypted storage at rest through Supabase, secure authentication, and access controls that limit who can see your data internally. No system is perfectly secure. If we ever become aware of a data breach that may affect you, we will notify you and the Office of the Australian Information Commissioner as required by the Notifiable Data Breaches scheme.</P>
        </Section>

        <Section title="Children and young people">
          <P>Simplifii-OS is designed to support students in secondary school and higher education. We do not knowingly collect information from anyone under 13 years of age. If you are between 13 and 17, you should review this policy with a parent, carer, or trusted adult before signing up.</P>
          <P>If you are a parent or carer and you believe a child under 13 has signed up, please contact us and we will delete the account.</P>
        </Section>

        <Section title="Cookies and tracking">
          <P>Simplifii-OS uses a small number of essential cookies and local storage entries needed to keep you logged in and to remember your preferences. We do not use third-party advertising cookies. We do not use cross-site tracking.</P>
        </Section>

        <Section title="Changes to this policy">
          <P>We may update this policy from time to time. When we make significant changes, we will let you know through the app or by email. The "last updated" date at the top of this page will always show when it was last revised.</P>
        </Section>

        <Section title="Contact">
          <P>For any privacy questions, requests, or complaints, contact:</P>
          <P>
            Aaron Saint-James<br />
            Founder, Simplifii Pty Ltd<br />
            Email: <Mailto /><br />
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

function P({ children }) {
  return <p style={s.body}>{children}</p>;
}

function Mailto() {
  return <a href="mailto:aaron@simplifii.com.au" style={s.link}>aaron@simplifii.com.au</a>;
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
  link: {
    textDecoration: 'underline',
  },
};
