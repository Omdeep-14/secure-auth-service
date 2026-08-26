import { transporter } from "../config/mail.js";
import { env } from "../config/env.js";

export const sendOtpEmail = async (email: string, otp: string) => {
  await transporter.sendMail({
    from: `"Auth Project" <${env.SMTP_USER}>`,
    to: email,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 5 minutes.`,
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
    `,
  });
};
