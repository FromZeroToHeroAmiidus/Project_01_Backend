import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, LoginDto, SignUpDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PasswordResetService } from '../auth/password-reset.services';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private passwordResetService: PasswordResetService,
    private emailService: EmailService,
  ) {}

  async signup(dto: SignUpDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new ForbiddenException('Password and Confirm Password Must Match!');
    }

    const hashedPassword = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
        },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('Email already taken');
      }
      this.logger.error('Error during user signup', error.stack);
      throw error;
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };
    const secret = this.config.get<string>('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '10h',
      secret,
    });

    return { access_token: token };
  }

  async signin(dto: LoginDto, res: Response): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await argon.verify(user.hash, dto.password))) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true, // Enable in production
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // Enable in production
    });

    res.json({ access_token: accessToken, refresh_token: refreshToken });
  }

  async refreshToken(refreshToken: string, res: Response): Promise<void> {
    try {
      const decodedToken = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const userId = decodedToken.sub;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = this.generateAccessToken(user.id);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true, // Enable in production
      });

      res.json({ access_token: accessToken, refresh_token: refreshToken });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.passwordResetService.requestPasswordReset(email);
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const resetToken = await this.passwordResetService.findUnique({ token });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token is invalid or has expired.');
    }

    const hashedPassword = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { hash: hashedPassword },
    });

    await this.passwordResetService.delete({ token });

    const user = await this.prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.emailService.sendNewPasswordEmail(user.email, newPassword);

    return {
      message:
        'Password has been reset and a new password has been sent to your email.',
    };
  }

  private generateAccessToken(userId: number): string {
    const payload = { sub: userId };
    const secret = this.config.get<string>('JWT_SECRET');
    return this.jwt.sign(payload, {
      secret,
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(userId: number): string {
    const payload = { sub: userId };
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    return this.jwt.sign(payload, {
      secret,
      expiresIn: '7d',
    });
  }
}
