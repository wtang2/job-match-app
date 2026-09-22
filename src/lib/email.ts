import { createEmailVerificationToken, saveSentEmail } from './db';
import { SentEmail } from './types';

export function generateVerificationEmailHtml(name: string, verifyUrl: string): string {
  const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'there';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 32px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background-color: rgba(255, 255, 255, 0.2); border-radius: 14px; margin-bottom: 12px;">
                <span style="font-size: 28px;">✉️</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">JobFinder</h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">Next-Gen Career & Job Search Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Verify your email address</h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Hi <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Welcome to JobFinder! Thank you for creating your account. To complete your registration and unlock full access to job applications, personalized matching, and recruiter alerts, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); text-align: center;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px 0; font-size: 13px; line-height: 1.5; color: #6b7280;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; word-break: break-all; font-family: monospace; font-size: 12px; color: #4f46e5; margin-bottom: 24px;">
                <a href="${verifyUrl}" style="color: #4f46e5; text-decoration: none;">${verifyUrl}</a>
              </div>

              <div style="border-top: 1px solid #f3f4f6; padding-top: 18px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
                  ⏱️ This verification link expires in <strong>24 hours</strong>.<br>
                  If you didn't create an account with JobFinder, you can safely disregard this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} JobFinder Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendVerificationEmail(
  user: { id: string; name: string; email: string },
  origin?: string
): Promise<{ success: boolean; verifyUrl: string; token: string; email: SentEmail }> {
  // Determine base url
  let baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Create verification token
  const token = createEmailVerificationToken(user.id, user.email);
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your email address - JobFinder';
  const htmlContent = generateVerificationEmailHtml(user.name, verifyUrl);

  // Save to database
  const sentEmail = saveSentEmail({
    userId: user.id,
    toEmail: user.email,
    subject,
    htmlContent,
    actionUrl: verifyUrl,
  });

  // Log verification link for development convenience
  console.log('====================================================');
  console.log('📬 [EMAIL DISPATCHED] Verification Email Sent!');
  console.log(`To: ${user.email} (${user.name})`);
  console.log(`Subject: ${subject}`);
  console.log(`🔗 Verification Link: ${verifyUrl}`);
  console.log('====================================================');

  return {
    success: true,
    verifyUrl,
    token,
    email: sentEmail,
  };
}
