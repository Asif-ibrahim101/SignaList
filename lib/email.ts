import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  await resend.emails.send({
    from: 'SignaList <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your SignaList password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset the password for your SignaList account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: #eab308;
                  color: #1a1a1a; text-decoration: none; font-weight: bold;
                  text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          If you did not request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
        <p style="color: #999; font-size: 13px;">
          If the button does not work, copy and paste this URL into your browser:<br/>
          <a href="${resetUrl}" style="color: #eab308;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};
