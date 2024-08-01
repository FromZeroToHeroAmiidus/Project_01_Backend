import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';
import * as argon from 'argon2'; // Import argon2 for password hashing

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Function to find a unique password reset token
  async findUniqueToken(token: string) {
    if (!token) {
      throw new Error('Token is required to find the password reset record.');
    }

    // Query the database for the unique token
    return this.prisma.passwordResetToken.findUnique({
      where: { token }, // Ensure 'token' is correctly defined in the Prisma schema
    });
  }

  // Function to request a password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Email not found in our records.');
    }

    // Generate a token and set its expiry
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store the token in the database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send the password reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(email, resetLink);

    return { message: 'Password reset email sent.' };
  }

  // Function to create a new password reset token record
  async create(data: { userId: number; token: string; expiresAt: Date }) {
    return this.prisma.passwordResetToken.create({ data });
  }

  // Function to find a unique password reset token
  async findUnique(where: { token: string }) {
    if (!where.token) {
      throw new Error('Token is required to find the password reset record.');
    }
    return this.prisma.passwordResetToken.findUnique({ where });
  }

  // Function to delete a password reset token
  async delete(where: { token: string }) {
    if (!where.token) {
      throw new Error('Token is required to delete the password reset record.');
    }
    return this.prisma.passwordResetToken.delete({ where });
  }

  async resetPassword(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new Error('Token is required to reset the password.');
    }

    const resetToken = await this.findUniqueToken(token);

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new ForbiddenException('Token is invalid or has expired.');
    }

    // Generate a new password
    const newPassword = uuidv4().slice(0, 8); // Generate a new temporary password
    const hashedPassword = await argon.hash(newPassword);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { hash: hashedPassword },
    });

    // Delete the used password reset token
    await this.prisma.passwordResetToken.delete({
      where: { token: resetToken.token },
    });

    // Retrieve the updated user
    const user = await this.prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Send the new password to the user's email
    await this.emailService.sendNewPasswordEmail(user.email, newPassword);

    return {
      message:
        'Password has been reset and a new password has been sent to your email.',
    };
  }
}
