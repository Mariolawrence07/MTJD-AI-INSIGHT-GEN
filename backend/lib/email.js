// // utils/email.js
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



// import sgMail from "@sendgrid/mail";

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// export async function sendPasswordResetEmail({ to, resetUrl }) {
//   const msg = {
//     to,
//     from: process.env.EMAIL_FROM, // MUST be verified sender
//     subject: "Reset your password",
//     html: `
//       <div style="font-family: Arial, sans-serif; line-height:1.6">
//         <h2>Password Reset</h2>

//         <p>You requested a password reset.</p>

//         <p>
//           <a href="${resetUrl}"
//              style="
//                display:inline-block;
//                padding:12px 20px;
//                background:#111827;
//                color:white;
//                text-decoration:none;
//                border-radius:6px;
//                font-weight:bold;">
//              Reset Password
//           </a>
//         </p>

//         <p>This link expires in <b>15 minutes</b>.</p>

//         <p>If you didn't request this, you can safely ignore this email.</p>
//       </div>
//     `,
//   };

//   await sgMail.send(msg);
// }