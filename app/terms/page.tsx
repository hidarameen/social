import Link from 'next/link';
import type { Metadata } from 'next';
import { AppLogo } from '@/components/common/app-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LAST_UPDATED = 'February 13, 2026';
const APP_NAME = process.env.APP_NAME || 'SocialFlow';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://example.com';
const CONTACT_EMAIL = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || 'support@example.com';

export const metadata: Metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: `Terms of Service for ${APP_NAME}.`,
};

const sections: Array<{ title: string; body: string[] }> = [
  {
    title: '1. Acceptance of Terms',
    body: [
      `By accessing or using ${APP_NAME}, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the service.`,
      'These Terms apply to all users, including account owners, operators, and API-connected workspace members.',
    ],
  },
  {
    title: '2. Service Description',
    body: [
      `${APP_NAME} provides tools for social media automation, account integrations, scheduling, publishing workflows, and analytics.`,
      'Features may change over time to improve performance, security, and compliance.',
    ],
  },
  {
    title: '3. Eligibility and Accounts',
    body: [
      'You are responsible for maintaining the confidentiality of your login credentials and all activity under your account.',
      'You must provide accurate account information and keep it updated.',
    ],
  },
  {
    title: '4. Third-Party Platforms and APIs',
    body: [
      'Our service may connect to third-party services such as Facebook, Instagram, Google, YouTube, TikTok, X (Twitter), Telegram, and LinkedIn.',
      'Your use of those services remains subject to their own terms, policies, and developer platform rules.',
      'You must not use our service to violate API rate limits, usage restrictions, platform automation rules, or content policies.',
    ],
  },
  {
    title: '5. User Content and Permissions',
    body: [
      'You retain ownership of your content.',
      `You grant ${APP_NAME} the rights necessary to process, transform, and deliver content on your behalf according to your configured workflows.`,
      'You represent that you have the rights and permissions required for all content you submit or publish.',
    ],
  },
  {
    title: '6. Prohibited Use',
    body: [
      'You may not use the service for unlawful, abusive, deceptive, or fraudulent purposes.',
      'You may not distribute malware, attempt unauthorized access, scrape protected data, or interfere with service integrity.',
      'You may not use the service to post content that infringes intellectual property or privacy rights.',
    ],
  },
  {
    title: '7. Security and Abuse Controls',
    body: [
      'We may monitor service health, apply abuse prevention controls, and suspend risky operations for security reasons.',
      'We may temporarily limit or block access to protect users, connected platforms, or infrastructure.',
    ],
  },
  {
    title: '8. Availability and Changes',
    body: [
      'The service is provided on an "as available" basis.',
      'We do not guarantee uninterrupted availability, error-free operation, or compatibility with every third-party platform at all times.',
    ],
  },
  {
    title: '9. Disclaimer of Warranties',
    body: [
      'To the maximum extent permitted by law, the service is provided without warranties of any kind, express or implied.',
      'You use the service at your own risk.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages.',
      'This includes loss of data, profits, goodwill, platform access, or business interruption arising from service use.',
    ],
  },
  {
    title: '11. Suspension and Termination',
    body: [
      'We may suspend or terminate access for violations of these Terms, legal requirements, or platform compliance obligations.',
      'You may stop using the service at any time.',
    ],
  },
  {
    title: '12. Updates to Terms',
    body: [
      'We may update these Terms from time to time.',
      `The "Last Updated" date reflects the latest revision. Continued use of the service after changes means you accept the revised Terms.`,
    ],
  },
  {
    title: '13. Contact',
    body: [
      `For legal, policy, or compliance questions, contact: ${CONTACT_EMAIL}.`,
      `Service URL: ${APP_URL}`,
    ],
  },
];

export default function TermsPage() {
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
            <CardTitle className="text-2xl sm:text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              These terms govern your access to and use of {APP_NAME}.
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
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
