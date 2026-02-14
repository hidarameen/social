import Link from 'next/link';
import type { Metadata } from 'next';
import { AppLogo } from '@/components/common/app-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LAST_UPDATED = 'February 13, 2026';
const APP_NAME = process.env.APP_NAME || 'SocialFlow';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://example.com';
const CONTACT_EMAIL = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || 'support@example.com';

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: `Privacy Policy for ${APP_NAME}.`,
};

const sections: Array<{ title: string; body: string[] }> = [
  {
    title: '1. Overview',
    body: [
      `This Privacy Policy explains how ${APP_NAME} collects, uses, stores, and protects personal data when you use the service.`,
      `By using ${APP_NAME}, you acknowledge the practices described in this policy.`,
    ],
  },
  {
    title: '2. Data We Collect',
    body: [
      'Account data: name, email, hashed password, profile details, and authentication status.',
      'Connected platform data: account IDs, usernames, and authorized tokens or credentials required for integrations.',
      'Operational data: task configurations, execution logs, message metadata, error records, and performance analytics.',
      'Technical data: IP address, browser/device metadata, cookies, and security telemetry.',
    ],
  },
  {
    title: '3. How We Use Data',
    body: [
      'To provide core functionality such as authentication, scheduling, publishing workflows, and analytics.',
      'To maintain security, detect abuse, and enforce platform/API compliance requirements.',
      'To communicate transactional notices (for example verification codes, password reset codes, and important account alerts).',
    ],
  },
  {
    title: '4. Third-Party Integrations',
    body: [
      'When you connect third-party platforms (for example Facebook, Google, YouTube, TikTok, X, Telegram, and LinkedIn), we process authorized data needed to operate your configured workflows.',
      'Those platforms process your data under their own privacy terms and developer policies.',
      'We do not sell your platform credentials or tokens.',
    ],
  },
  {
    title: '5. Data Sharing',
    body: [
      'We do not sell personal data.',
      'We may share limited data with infrastructure/service providers required to deliver the service (for example hosting, email delivery, monitoring, and database providers).',
      'We may disclose data when required by law, legal process, or to protect rights, safety, and system integrity.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain data as long as needed to provide the service, maintain security records, resolve disputes, and meet legal obligations.',
      'You may request account deletion; certain records may be retained where required by law or legitimate security needs.',
    ],
  },
  {
    title: '7. Security',
    body: [
      'We apply technical and organizational safeguards to protect data against unauthorized access, loss, or misuse.',
      'No method of transmission or storage is completely risk-free; you are responsible for securing your account credentials.',
    ],
  },
  {
    title: '8. Your Choices and Rights',
    body: [
      'You can update account information, disconnect integrations, and rotate credentials from within the app where available.',
      'You may contact us to request data access, correction, or deletion, subject to applicable law.',
    ],
  },
  {
    title: '9. Data Deletion Requests',
    body: [
      'For platform/API compliance requests (including Facebook/Google/YouTube app review), you can request deletion by contacting us using the email below from your registered account email.',
      'Include your account email and requested scope (full account deletion or specific integration deletion). We will verify identity before processing.',
    ],
  },
  {
    title: '10. International Processing',
    body: [
      'Your data may be processed in regions where our service providers operate.',
      'By using the service, you acknowledge cross-border processing where legally permitted.',
    ],
  },
  {
    title: '11. Policy Updates',
    body: [
      'We may update this Privacy Policy from time to time.',
      'Material updates will be reflected by revising the Last Updated date.',
    ],
  },
  {
    title: '12. Contact',
    body: [
      `For privacy or compliance inquiries, contact: ${CONTACT_EMAIL}.`,
      `Service URL: ${APP_URL}`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <AppLogo variant="splash" size={42} />
          <div className="text-sm text-muted-foreground">
            Last Updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </div>
        </div>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              This policy describes how {APP_NAME} handles personal and integration data.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
            <div className="pt-2 text-sm text-muted-foreground">
              Read also:{' '}
              <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
