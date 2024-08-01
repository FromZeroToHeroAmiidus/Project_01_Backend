// bid.controller.ts
import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { BidService } from './bid.service';
import { AuctionService } from 'src/auction/auction.service';
import { PlaceBidDTO, BidDTO } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { Auction, Bid } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('bids')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Post(':auctionId')
  async placeBid(
    @Param('auctionId') auctionId: string, // Note: auctionId as string
    @GetUser('id') bidderId: number,
    @Body() placeBidDTO: PlaceBidDTO,
  ): Promise<Bid> {
    return this.bidService.placeBid(auctionId, bidderId, placeBidDTO);
  }

  @Post('auction/:auctionId')
  async getBidsForAuction(
    @Param('auctionId') auctionId: number,
  ): Promise<Bid[]> {
    return this.bidService.getBidsForAuction(auctionId);
  }
}
