import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser'; // Import cookie-parser
//import { CookieParserMiddleware } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuctionModule } from './auction/auction.module';
import { MeModule } from './project-demanded-endpoints/me.module';
import { PrismaModule } from './prisma/prisma.module';

import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthMiddleware } from './auth/util/authMiddleware';
import { BidModule } from './bid/bid.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MeController } from './project-demanded-endpoints/me.controller';

//import { LoggerMiddleware } from 'middleware/logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // lol ... kukr @global zadeva | branje .env
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get JWT_SECRET from environment variables
        signOptions: { expiresIn: '10h' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    AuctionModule,
    BidModule,
    PrismaModule,
    MeModule,
    ScheduleModule.forRoot(),
  ],
  // controllers: [AuthController],
  // controllers: [MeController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      //  .apply(cookieParser())
      //.forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply cookie-parser middleware
      .apply(AuthMiddleware)
      .forRoutes(
        'auth/check',
        'auth/signout',
        'bids/',
        'users/get/image',
        'auctions/active/other-users',
      );
  }
}
