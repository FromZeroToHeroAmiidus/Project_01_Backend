import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordResetService } from './password-reset.services';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Ensure JWT secret is provided
      signOptions: { expiresIn: '60m' }, // Example expiration time
    }),
    // Add other necessary modules if required
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    ConfigService,
    PasswordResetService,
    EmailService,
  ],
  exports: [AuthService, PasswordResetService, EmailService], // Export services if needed elsewhere
})
export class AuthModule {}
