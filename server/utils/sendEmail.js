import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    return { messageId: 'dev-mode-no-send' };
  }

  const info = await transporter.sendMail({
    from: `"AutoPulse AI" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return info;
};

export default sendEmail;
