const nodemailer = require('nodemailer');

// ── Create transporter (the "sender" object) ──────────────────────────────
const createTransporter = () => {
  // Option A: Gmail (production)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,   // App Password, not your real password
      },
    });
  }

  // Option B: Ethereal (fallback for testing — no real emails sent)
  // If EMAIL_USER is not set, we create a test account automatically
  console.log('⚠️  EMAIL_USER not set — using Ethereal test mode');
  return null;
};

// ── Core send function ────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    let transporter = createTransporter();

    // If no Gmail config, auto-create Ethereal test account
    if (!transporter) {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host:   'smtp.ethereal.email',
        port:    587,
        secure:  false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || '"WasteTracker" <no-reply@wastetracker.com>',
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);

    // If using Ethereal, log preview URL so you can view the email
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Preview email at: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Email failure should NEVER crash the main request
    // We just log the error and continue
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };