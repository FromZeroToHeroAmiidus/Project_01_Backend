import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UserService } from '../user/user.service';
import { AuctionService } from '../auction/auction.service';
import { AuthService } from 'src/auth/auth.service';
import { PasswordResetService } from 'src/auth/password-reset.services';
import { AuthModule } from 'src/auth/auth.module';
import { AuctionModule } from 'src/auction/auction.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
//import { PrismaService } from '../prisma.service'; // Add this if you are using Prisma

@Module({
  imports: [AuthModule, AuctionModule, PrismaModule, JwtModule], // List other modules if needed, e.g., TypeOrmModule or PrismaModule
  controllers: [MeController],
  providers: [UserService, AuctionService, AuthService, PasswordResetService],
  exports: [UserService, AuctionService, AuthService, PasswordResetService], // Export providers if needed in other modules
})
export class MeModule {}
