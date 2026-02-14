import { buildPasswordResetEmailTemplate, buildVerificationEmailTemplate } from '@/lib/email/templates';

type SendVerificationEmailInput = {
  to: string;
  recipientName?: string;
  code: string;
  expiresInMinutes: number;
  verificationUrl?: string;
};

type SendPasswordResetEmailInput = {
  to: string;
  recipientName?: string;
  code: string;
  expiresInMinutes: number;
  resetUrl?: string;
};

function getAppName(): string {
  return String(process.env.APP_NAME || 'SocialFlow').trim() || 'SocialFlow';
}

function getEmailFrom(): string {
  return String(process.env.EMAIL_FROM || '').trim();
}

function getResendApiKey(): string {
  return String(process.env.RESEND_API_KEY || '').trim();
}

function getEmailReplyTo(): string | undefined {
  const value = String(process.env.EMAIL_REPLY_TO || '').trim();
  return value || undefined;
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(getEmailFrom() && getResendApiKey());
}

function parseErrorText(raw: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return String(parsed?.message || parsed?.error || raw);
  } catch {
    return raw;
  }
}

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  const apiKey = getResendApiKey();
  const from = getEmailFrom();
  if (!apiKey || !from) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  }

  const appName = getAppName();
  const replyTo = getEmailReplyTo();
  const template = buildVerificationEmailTemplate({
    appName,
    recipientName: input.recipientName,
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    verificationUrl: input.verificationUrl,
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    const details = parseErrorText(raw);
    throw new Error(
      `Email provider failed (${response.status} ${response.statusText})${details ? `: ${details}` : ''}`
    );
  }
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  const apiKey = getResendApiKey();
  const from = getEmailFrom();
  if (!apiKey || !from) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  }

  const appName = getAppName();
  const replyTo = getEmailReplyTo();
  const template = buildPasswordResetEmailTemplate({
    appName,
    recipientName: input.recipientName,
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    resetUrl: input.resetUrl,
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    const details = parseErrorText(raw);
    throw new Error(
      `Email provider failed (${response.status} ${response.statusText})${details ? `: ${details}` : ''}`
    );
  }
}
