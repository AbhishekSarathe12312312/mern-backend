import nodemailer from "nodemailer";
import "dotenv/config";

export const verifyEmail = async (token, email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Verify your email: http://localhost:5173/verify/${token}`,
    });

    console.log("Verification email sent");
  } catch (error) {
    console.log("Email error:", error);
    throw error;
  }
};