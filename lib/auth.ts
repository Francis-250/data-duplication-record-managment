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

import { ac, admin, registry_staff, student } from "./permission";
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
        subject: "Reset Your Password - University of Kigali",
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
  appName: "University of Kigali Record Deduplication System",
  plugins: [
    adminPlugin({
      defaultRole: "STUDENT",
      ac,
      roles: {
        admin,
        registry_staff,
        student,
        ADMIN: admin,
        REGISTRY_STAFF: registry_staff,
        STUDENT: student,
      },
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
            subject: `${otp} is your University of Kigali verification code`,
            text: `Your University of Kigali verification code is ${otp}. It expires in 10 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Verify your University of Kigali email</h2>
                <p>This code was requested for <strong>${email}</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <code style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</code>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <hr style="margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">University of Kigali - Data Deduplication & Record Matching System</p>
              </div>
            `,
          });
        } else if (type === "sign-in") {
          await sendEmailOrThrow({
            to: email,
            subject: "Your OTP for Sign-In - University of Kigali",
            text: `Your sign-in code is ${otp}.`,
            html: `<p>Your OTP for sign-in is: <strong>${otp}</strong></p>`,
          });
        } else {
          await sendEmailOrThrow({
            to: email,
            subject: "Your OTP Code - University of Kigali",
            text: `Your OTP code is ${otp}.`,
            html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
          });
        }
      },
    }), 
    nextCookies(),
  ],
});
