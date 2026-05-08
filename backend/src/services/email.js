import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your regular password)
  },
});

export async function sendPasswordResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"CodeForge" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your CodeForge password",
    html: `
      <div style="font-family: monospace; max-width: 520px; margin: 0 auto; background: #FAF7F0; border: 1px solid #E0D8CA; padding: 40px;">
        <div style="margin-bottom: 28px;">
          <span style="background: #C04A1A; color: #FAF7F0; font-size: 12px; font-weight: bold; padding: 4px 10px; letter-spacing: 2px; text-transform: uppercase;">CODEFORGE</span>
        </div>
        <h2 style="font-size: 22px; color: #1A1208; margin: 0 0 12px;">Reset your password</h2>
        <p style="color: #7A6E5A; font-size: 13px; line-height: 1.8; margin: 0 0 28px;">
          We received a request to reset your password. Click the button below to set a new one.
          This link expires in <strong>10 minutes</strong>.
        </p>
        <a href="${resetLink}"
           style="display: inline-block; background: #C04A1A; color: #FAF7F0; text-decoration: none;
                  padding: 12px 28px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
          Reset Password →
        </a>
        <p style="color: #A0917E; font-size: 11px; margin-top: 32px; line-height: 1.7;">
          If you did not request a password reset, you can safely ignore this email.<br/>
          Your password will not change.
        </p>
        <hr style="border: none; border-top: 1px solid #E0D8CA; margin: 28px 0 16px;" />
        <p style="color: #C4B8A4; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
          © 2026 CodeForge
        </p>
      </div>
    `,
  });
}
