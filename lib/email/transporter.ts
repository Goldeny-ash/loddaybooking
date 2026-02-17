// lib/mailer.ts
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER!.trim();
const smtpPass = process.env.SMTP_PASS!.trim();

// Use one of the certificate SANs exactly as the host
const SMTP_HOST = "workplaceproemail.com"; // matches certificate SAN exactly
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

const FROM_ADDRESS = `"Lodday Notifications" <${smtpUser}>`;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // SSL on 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    // rejectUnauthorized true ensures SSL is validated
    rejectUnauthorized: true,
    // Accept certificate if the host is in SAN list
    checkServerIdentity: (host, cert) => {
      const allowedHosts = cert.subjectaltname
        ? cert.subjectaltname
            .split(", ")
            .map((h: string) => h.replace(/^DNS:/, "").trim())
        : [];
      if (!allowedHosts.includes(host)) {
        return new Error(
          `Hostname "${host}" is not in certificate SANs: ${allowedHosts.join(
            ", "
          )}`
        );
      }
    },
  },
});

export async function verifySMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err);
    throw err;
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
}
