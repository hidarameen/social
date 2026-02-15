import { buildPasswordResetEmailTemplate, buildVerificationEmailTemplate } from '@/lib/email/templates';
import nodemailer from 'nodemailer';

type EmailProvider = 'resend' | 'gmail-smtp';

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

function getEmailProvider(): EmailProvider {
  const raw = String(process.env.EMAIL_PROVIDER || 'resend')
    .trim()
    .toLowerCase();
  if (!raw || raw === 'resend') return 'resend';
  if (raw === 'gmail' || raw === 'gmail-smtp' || raw === 'gmail_smtp') return 'gmail-smtp';
  throw new Error('Invalid EMAIL_PROVIDER. Supported values: resend, gmail-smtp.');
}

function getResendApiKey(): string {
  return String(process.env.RESEND_API_KEY || '').trim();
}

function getGmailSmtpUser(): string {
  return String(process.env.GMAIL_SMTP_USER || '').trim();
}

function getGmailSmtpAppPassword(): string {
  return String(process.env.GMAIL_SMTP_APP_PASSWORD || '')
    .trim()
    .replace(/\s+/g, '');
}

function getEmailReplyTo(): string | undefined {
  const value = String(process.env.EMAIL_REPLY_TO || '').trim();
  return value || undefined;
}

export function isEmailDeliveryConfigured(): boolean {
  const from = getEmailFrom();
  if (!from) return false;

  try {
    const provider = getEmailProvider();
    if (provider === 'resend') {
      return Boolean(getResendApiKey());
    }
    return Boolean(getGmailSmtpUser() && getGmailSmtpAppPassword());
  } catch {
    return false;
  }
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

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

let gmailTransporter: nodemailer.Transporter | undefined;

function getGmailTransporter(): nodemailer.Transporter {
  if (gmailTransporter) return gmailTransporter;

  const user = getGmailSmtpUser();
  const appPassword = getGmailSmtpAppPassword();
  if (!user || !appPassword) {
    throw new Error('Email delivery is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.');
  }

  gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass: appPassword,
    },
  });

  return gmailTransporter;
}

async function sendWithResend(to: string, template: RenderedEmail): Promise<void> {
  const from = getEmailFrom();
  const apiKey = getResendApiKey();
  if (!from || !apiKey) {
    throw new Error('Email delivery is not configured. Set EMAIL_FROM and RESEND_API_KEY.');
  }

  const replyTo = getEmailReplyTo();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
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

async function sendWithGmailSmtp(to: string, template: RenderedEmail): Promise<void> {
  const from = getEmailFrom();
  if (!from) {
    throw new Error('Email delivery is not configured. Set EMAIL_FROM.');
  }

  const transporter = getGmailTransporter();
  const replyTo = getEmailReplyTo();

  try {
    await transporter.sendMail({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(replyTo ? { replyTo } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';
    throw new Error(`Email provider failed (gmail-smtp): ${message}`);
  }
}

async function sendTransactionalEmail(to: string, template: RenderedEmail): Promise<void> {
  const provider = getEmailProvider();
  if (provider === 'resend') {
    await sendWithResend(to, template);
    return;
  }
  await sendWithGmailSmtp(to, template);
}

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  const appName = getAppName();
  const template = buildVerificationEmailTemplate({
    appName,
    recipientName: input.recipientName,
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    verificationUrl: input.verificationUrl,
  });

  await sendTransactionalEmail(input.to, template);
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  const appName = getAppName();
  const template = buildPasswordResetEmailTemplate({
    appName,
    recipientName: input.recipientName,
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    resetUrl: input.resetUrl,
  });

  await sendTransactionalEmail(input.to, template);
}
