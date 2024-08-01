// src/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      throw new Error(
        'EMAIL_USER and EMAIL_PASS environment variables must be set',
      );
    }

    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Password Reset Instructions',
      html: `
        <p>Hello,</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="padding: 10px 20px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
        <p>Button not working for you? Copy the URL below into your browser:</p>
        <p>${resetLink}</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error.stack,
      );
      throw new Error(`Failed to send password reset email to ${to}`);
    }
  }

  async sendNewPasswordEmail(to: string, newPassword: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Password Was Changed',
      html: `
        <p>Hello,</p>
        <p>Your password was changed and now it's: <strong>${newPassword}</strong></p>
        <p>Please consider this password as a temporary password.</p>
        <p>We strongly advise you to change it immediately after you log in under your profile settings.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`New password email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send new password email to ${to}`,
        error.stack,
      );
      throw new Error(`Failed to send new password email to ${to}`);
    }
  }
}
