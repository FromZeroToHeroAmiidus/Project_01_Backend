import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaceBidDTO, BidDTO } from './dto';
import { Bid, Auction } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';

@Injectable()
export class BidService {
  constructor(private readonly prisma: PrismaService) {}

  async placeBid(
    auctionIdString: string,
    bidderId: number,
    placeBidDTO: PlaceBidDTO,
  ): Promise<Bid> {
    // Convert auction ID to number
    const auctionId = parseInt(auctionIdString, 10);
    if (isNaN(auctionId)) {
      throw new BadRequestException('Invalid auction ID');
    }

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.ownerId === bidderId) {
      throw new ForbiddenException('You cannot bid on your own auction');
    }

    if (
      // placeBidDTO.amount <= auction.startingBid ||
      placeBidDTO.amount <= auction.currentBid
    ) {
      throw new BadRequestException(
        'Bid amount must be greater than the current highest bid',
      );
    }

    const lastInsertedBid = await this.getBidsForAuction(auctionId);
    if (lastInsertedBid.length !== 0) {
      if (lastInsertedBid.at(0).bidderId === bidderId) {
        throw new ForbiddenException(
          'You cannot bid - you are winning at the moment!',
        );
      }
    }

    // Update the currentBid property of the auction
    const updatedAuction = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { currentBid: placeBidDTO.amount },
    });

    // Create the bid
    const createdBid = await this.prisma.bid.create({
      data: {
        amount: placeBidDTO.amount,
        auctionId,
        bidderId,
      },
    });

    return createdBid;
  }

  async getBidsForAuction(auctionId: number): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { amount: 'desc' },
    });
  }

  async getLastInsertedBid(): Promise<Bid | null> {
    return this.prisma.bid.findFirst({
      orderBy: { id: 'desc' }, // Order by bid ID in descending order
    });
  }
}
