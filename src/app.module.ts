import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // lol ... kukr @global zadeva | branje .env
    }),
    AuthModule,
    PrismaModule,
  ],
})
export class AppModule {}
