// utils/email.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,          // e.g. smtp.gmail.com or mailgun host
  port: Number(process.env.EMAIL_PORT),  // 587 typically
  secure: false,                         // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click this link to reset your password (expires in 15 minutes):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  });
}
