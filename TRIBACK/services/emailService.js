const env = require("../config/env");

let resendClient = null;
if (env.resend.apiKey) {
  try {
    const { Resend } = require("resend");
    resendClient = new Resend(env.resend.apiKey);
  } catch (_error) {
    resendClient = null;
  }
}

function buildOtpEmailHtml(otpCode) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:32px 32px 24px;">
                <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:0.08em;color:#e8172c;text-transform:uppercase;">TriQI+</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;">Your verification code</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:22px;color:#475569;">
                  Enter this code to verify your email address. The code expires in 5 minutes.
                </p>
                <div style="margin:28px 0;background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;">
                  <span style="font-size:32px;letter-spacing:0.4em;font-weight:700;color:#0f172a;">${otpCode}</span>
                </div>
                <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendWithBrevo(email, otpCode) {
  if (!env.brevo.apiKey) return { skipped: true };
  if (!env.brevo.fromEmail) {
    throw Object.assign(new Error("BREVO_FROM_EMAIL is required when BREVO_API_KEY is set."), {
      status: 500,
      publicMessage: "Email provider is misconfigured.",
    });
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.brevo.apiKey,
    },
    body: JSON.stringify({
      sender: { name: env.brevo.fromName, email: env.brevo.fromEmail },
      to: [{ email }],
      subject: "Your verification code – TriQI+",
      htmlContent: buildOtpEmailHtml(otpCode),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.code || "Brevo send failed");
  }

  return { skipped: false, provider: "brevo" };
}

async function sendWithResend(email, otpCode) {
  if (!resendClient) return { skipped: true };

  const { error } = await resendClient.emails.send({
    from: env.resend.fromEmail,
    to: [email],
    subject: "Your verification code – TriQI+",
    html: buildOtpEmailHtml(otpCode),
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }

  return { skipped: false, provider: "resend" };
}

async function sendOtpEmail(email, otpCode) {
  const brevo = await sendWithBrevo(email, otpCode);
  if (!brevo.skipped) return brevo;

  const resend = await sendWithResend(email, otpCode);
  if (!resend.skipped) return resend;

  throw Object.assign(new Error("No email delivery provider is configured."), {
    status: 503,
    publicMessage: "Email delivery is not available right now.",
  });
}

module.exports = { sendOtpEmail };
