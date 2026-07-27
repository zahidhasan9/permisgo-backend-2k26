import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_HOST) {
    console.log("Email skipped because SMTP is not configured:", {
      to,
      subject,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

export default sendEmail;
