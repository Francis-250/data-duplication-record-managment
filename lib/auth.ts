import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import {
  admin as adminPlugin,
  emailOTP,
  phoneNumber,
  twoFactor,
  username,
} from "better-auth/plugins";

import { ac, admin, doctor, patient } from "./permission";
import { nextCookies } from "better-auth/next-js";
import { sendEmail, sendEmailOrThrow } from "./brevo";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset Your Password",
        html: `Click The link: ${url}`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  appName: "Smart Stroke Assessment System",
  plugins: [
    adminPlugin({
      defaultRole: "patient",
      ac,
      roles: {admin, doctor, patient}
    }),
    phoneNumber(),
    username(),
    twoFactor(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      resendStrategy: "rotate",
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "email-verification") {
          await sendEmailOrThrow({
            to: email,
            subject: `${otp} is your StrokeCheck verification code`,
            text: `Your StrokeCheck verification code is ${otp}. It expires in 10 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Verify your StrokeCheck email</h2>
                <p>This code was requested for <strong>${email}</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <code style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</code>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <hr style="margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">Smart Stroke Assessment System</p>
              </div>
            `,
          });
        } else if (type === "sign-in") {
          await sendEmailOrThrow({
            to: email,
            subject: "Your OTP for Sign-In",
            text: `Your StrokeCheck sign-in code is ${otp}.`,
            html: `<p>Your OTP for sign-in is: <strong>${otp}</strong></p>`,
          });
        } else {
          await sendEmailOrThrow({
            to: email,
            subject: "Your OTP Code",
            text: `Your StrokeCheck OTP code is ${otp}.`,
            html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
          });
        }
      },
    }), 
    nextCookies(),
  ],
});
