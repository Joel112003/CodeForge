import nodemailer from "nodemailer";

const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10000);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  connectionTimeout: EMAIL_TIMEOUT_MS,
  greetingTimeout: EMAIL_TIMEOUT_MS,
  socketTimeout: EMAIL_TIMEOUT_MS,
});

export async function sendPasswordResetEmail(toEmail, resetLink) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  await transporter.sendMail({
    from: `"CodeForge" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your CodeForge password — expires in 10 min",
    text: `
CodeForge — Password Reset

We received a request to reset the password for your account.

Reset your password here:
${resetLink}

This link expires in 10 minutes and can only be used once.

If you didn't request this, you can safely ignore this email.
Your password will not change.

Need help? Contact us at support@codeforge.dev

© 2026 CodeForge
    `.trim(),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Reset your CodeForge password</title>
</head>
<body style="margin:0;padding:0;background:#EDE8DF;font-family:'DM Mono',Consolas,'Courier New',monospace;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#EDE8DF;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background:#FAF7F0;border:1px solid #E0D8CA;border-left:4px solid #C04A1A;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="padding:32px 40px 0;">

              <!-- Logo row -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;">
                    <!-- Logo square -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
                      <tr>
                        <td style="width:30px;height:30px;background:#C04A1A;text-align:center;vertical-align:middle;box-shadow:2px 2px 0 #8C3310;">
                          <span style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-style:italic;color:#FAF7F0;font-size:14px;line-height:30px;">C</span>
                        </td>
                        <td style="padding-left:8px;vertical-align:middle;">
                          <span style="font-size:10px;letter-spacing:0.13em;text-transform:uppercase;color:#7A6E5A;">CodeForge</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#C4B8A4;">Password Reset</span>
                  </td>
                </tr>
              </table>

              <!-- Gradient rule -->
              <div style="height:1px;background:linear-gradient(to right,#C04A1A,#E0D8CA);margin:20px 0 28px;"></div>

              <!-- Eyebrow -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
                <tr>
                  <td style="width:16px;height:1px;background:#C04A1A;vertical-align:middle;">&nbsp;</td>
                  <td style="padding-left:8px;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#C04A1A;vertical-align:middle;">Account Security</td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:2rem;font-weight:300;color:#1A1208;line-height:1.05;margin:0 0 16px;">
                Reset your<br>
                <em style="font-style:italic;font-weight:700;color:#C04A1A;">password.</em>
              </h1>

              <!-- Body copy -->
              <p style="font-size:12px;color:#7A6E5A;line-height:1.85;margin:0 0 28px;">
                We received a request to reset the password for your CodeForge account.
                Click the button below to set a new one.
              </p>

              <!-- ── CTA BUTTON ── -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#C04A1A;box-shadow:3px 3px 0 #8C3310;">
                    <a href="${resetLink}"
                      target="_blank"
                      style="display:inline-block;padding:14px 32px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#FAF7F0;text-decoration:none;font-weight:500;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ── EXPIRY CALLOUT ── -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#FEF2E8;border:1px solid #FBDECF;border-left:3px solid #C04A1A;padding:14px 16px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align:top;padding-right:10px;width:20px;">
                          <!-- Warning square -->
                          <div style="width:18px;height:18px;background:#C04A1A;text-align:center;line-height:18px;">
                            <span style="font-size:11px;color:#FAF7F0;font-weight:700;">!</span>
                          </div>
                        </td>
                        <td>
                          <p style="font-size:11px;color:#7A6E5A;line-height:1.75;margin:0;">
                            This link expires in <strong style="color:#C04A1A;">10 minutes</strong> and can only be used once.
                            If it expires, you can
                            <a href="${resetLink.replace(/\/reset-password.*/, "/forgot-password")}"
                              style="color:#C04A1A;text-decoration:underline;">request a new one</a>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ── FALLBACK URL ── -->
              <p style="font-size:10px;color:#A0917E;margin:0 0 6px;letter-spacing:0.02em;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#F0EBE2;border:1px solid #E0D8CA;padding:10px 14px;word-break:break-all;">
                    <a href="${resetLink}" style="font-size:10px;color:#C04A1A;text-decoration:none;letter-spacing:0.02em;">${resetLink}</a>
                  </td>
                </tr>
              </table>

              <!-- ── SAFETY NOTICE ── -->
              <div style="height:1px;background:#E0D8CA;margin-bottom:20px;"></div>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#F5F2EC;border-left:3px solid #E0D8CA;padding:12px 16px;">
                    <p style="font-size:11px;color:#A0917E;line-height:1.8;margin:0;">
                      <strong style="color:#7A6E5A;font-weight:500;">Didn't request this?</strong><br>
                      You can safely ignore this email — your password will not change unless
                      you click the link above. If you're concerned, contact us at
                      <a href="mailto:support@codeforge.dev" style="color:#C04A1A;text-decoration:underline;">support@codeforge.dev</a>.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="height:1px;background:#E0D8CA;margin-bottom:16px;"></div>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="font-size:9px;color:#C4B8A4;letter-spacing:0.08em;text-transform:uppercase;">
                    &copy; 2026 CodeForge &middot; All rights reserved
                  </td>
                  <td align="right">
                    <a href="https://codeforge.dev/privacy"
                      style="font-size:9px;color:#C4B8A4;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;margin-left:16px;">
                      Privacy
                    </a>
                    <a href="https://codeforge.dev/unsubscribe"
                      style="font-size:9px;color:#C4B8A4;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;margin-left:16px;">
                      Unsubscribe
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /email card -->

      </td>
    </tr>
  </table>

</body>
</html>`,
  });
}