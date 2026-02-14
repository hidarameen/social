function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type FrameInput = {
  appName: string;
  recipientName?: string;
  title: string;
  subtitle: string;
  codeLabel: string;
  code: string;
  expiresInMinutes: number;
  actionLabel: string;
  actionUrl?: string;
  supportNote?: string;
  accentStart: string;
  accentEnd: string;
  panelTint: string;
};

function renderCodeCells(code: string): string {
  const chars = (code || '').split('').slice(0, 8);
  if (!chars.length) {
    return `<div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0f172a;">------</div>`;
  }

  const cells = chars
    .map(
      (char) => `<td style="padding:0 4px;">
        <div style="width:44px;height:54px;line-height:54px;text-align:center;background:#ffffff;border:1px solid #cfdaf5;border-radius:12px;font-size:28px;font-weight:900;color:#0f172a;">
          ${escapeHtml(char)}
        </div>
      </td>`
    )
    .join('');

  return `<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr>${cells}</tr></table>`;
}

function renderEmailFrame(input: FrameInput): { subject: string; html: string; text: string } {
  const appName = escapeHtml(input.appName || 'SocialFlow');
  const recipientName = escapeHtml(input.recipientName || 'there');
  const title = escapeHtml(input.title);
  const subtitle = escapeHtml(input.subtitle);
  const codeLabel = escapeHtml(input.codeLabel);
  const code = escapeHtml(input.code || '');
  const expiresInMinutes = Math.max(1, Math.floor(input.expiresInMinutes || 15));
  const actionLabel = escapeHtml(input.actionLabel);
  const actionUrl = input.actionUrl ? escapeHtml(input.actionUrl) : '';
  const supportNote = escapeHtml(input.supportNote || '');
  const accentStart = escapeHtml(input.accentStart);
  const accentEnd = escapeHtml(input.accentEnd);
  const panelTint = escapeHtml(input.panelTint);
  const subject = `${appName} • ${title}`;
  const currentYear = new Date().getFullYear();
  const preheader = `Your ${appName} security code is ${code}. It expires in ${expiresInMinutes} minutes.`;
  const codeCells = renderCodeCells(code);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#edf2ff;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:30px 12px;background:radial-gradient(circle at 8% 0%, #dbeafe 0%, #edf2ff 45%, #f8fafc 100%);">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d7e2ff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.14);">
            <tr>
              <td style="padding:28px 28px 26px;background:linear-gradient(132deg,${accentStart} 0%,${accentEnd} 100%);color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0;">
                      <div style="display:inline-block;padding:7px 12px;border:1px solid rgba(255,255,255,0.34);border-radius:999px;background:rgba(255,255,255,0.14);font-size:11px;letter-spacing:0.8px;text-transform:uppercase;font-weight:700;">
                        ${appName}
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:16px;font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-0.4px;">
                  ${title}
                </div>
                <div style="margin-top:10px;font-size:15px;line-height:1.7;max-width:520px;opacity:0.97;">
                  ${subtitle}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#0f172a;">Hi ${recipientName},</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.78;color:#334155;">
                  Use the one-time code below to continue this secure action.
                </p>

                <div style="margin:0 0 16px;padding:22px 16px;border:1px solid #c8d8ff;border-radius:18px;background:${panelTint};text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,0.85);">
                  <div style="font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#334155;font-weight:800;margin-bottom:12px;">
                    ${codeLabel}
                  </div>
                  ${codeCells}
                </div>

                <div style="margin:0 0 18px;padding:14px 14px;border:1px solid #dbe5ff;border-radius:14px;background:#f8fbff;font-size:13px;color:#334155;line-height:1.75;">
                  This code expires in <strong>${expiresInMinutes} minutes</strong>, works only once, and should never be shared.
                </div>

                ${
                  actionUrl
                    ? `<div style="margin:0 0 18px;">
                         <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">
                           ${actionLabel}
                         </a>
                       </div>
                       <p style="margin:0 0 16px;font-size:12px;line-height:1.7;color:#64748b;">
                         If the button does not open, use this direct link:
                         <br />
                         <a href="${actionUrl}" style="color:#2563eb;word-break:break-all;text-decoration:none;">${actionUrl}</a>
                       </p>`
                    : ''
                }

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                  <tr>
                    <td style="padding:14px;border:1px solid #e7ecfb;border-radius:14px;background:#fcfdff;">
                      <div style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.6px;color:#0f172a;text-transform:uppercase;">
                        Security Reminder
                      </div>
                      <div style="font-size:12px;color:#475569;line-height:1.7;">
                        ${appName} support will never ask for this code. If this request was not made by you, ignore this email and review your recent activity.
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:10px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#64748b;line-height:1.7;">
                  ${supportNote || 'If you did not request this action, you can safely ignore this email.'}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 22px;">
                <div style="font-size:11px;color:#94a3b8;line-height:1.65;">
                  This is an automated security message from ${appName}. Please do not reply directly to this email.
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#64748b;">
            &copy; ${currentYear} ${appName}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    `${appName} - ${input.title}`,
    '',
    `Hi ${input.recipientName || 'there'},`,
    '',
    `Use this code to continue: ${input.code}`,
    `${input.codeLabel}: ${input.code}`,
    `This code expires in ${expiresInMinutes} minutes and can only be used once.`,
    input.actionUrl ? `${input.actionLabel}: ${input.actionUrl}` : '',
    '',
    `Security reminder: ${input.appName} support will never ask for this code.`,
    input.supportNote || 'If you did not request this action, ignore this email.',
  ].filter(Boolean);

  return {
    subject,
    html,
    text: textLines.join('\n'),
  };
}

export function buildVerificationEmailTemplate(input: {
  appName: string;
  recipientName?: string;
  code: string;
  expiresInMinutes: number;
  verificationUrl?: string;
}): { subject: string; html: string; text: string } {
  return renderEmailFrame({
    appName: input.appName,
    recipientName: input.recipientName,
    title: 'Email Verification Code',
    subtitle: 'Confirm your account ownership to activate secure sign-in.',
    codeLabel: 'Verification Code',
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    actionLabel: 'Open Verification Page',
    actionUrl: input.verificationUrl,
    supportNote: 'If you did not create an account, ignore this email.',
    accentStart: '#2f5cff',
    accentEnd: '#1fb7d5',
    panelTint: '#edf3ff',
  });
}

export function buildPasswordResetEmailTemplate(input: {
  appName: string;
  recipientName?: string;
  code: string;
  expiresInMinutes: number;
  resetUrl?: string;
}): { subject: string; html: string; text: string } {
  return renderEmailFrame({
    appName: input.appName,
    recipientName: input.recipientName,
    title: 'Password Reset Code',
    subtitle: 'Use this secure code to reset your account password.',
    codeLabel: 'Reset Code',
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
    actionLabel: 'Open Reset Page',
    actionUrl: input.resetUrl,
    supportNote: 'If you did not request a password reset, ignore this email.',
    accentStart: '#111827',
    accentEnd: '#1d4ed8',
    panelTint: '#eff6ff',
  });
}
