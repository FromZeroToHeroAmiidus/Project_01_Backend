// bid.module.ts
import { Module } from '@nestjs/common';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [BidService, PrismaService],
  controllers: [BidController],
})
export class BidModule {}
