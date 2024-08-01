import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuctionDTO } from './dto/create-auction.dto';
import { EditAuctionDTO } from './dto/edit-auction.dto';
import { Auction } from '@prisma/client';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Cron } from '@nestjs/schedule'; // Importing Cron from schedule

@Injectable()
export class AuctionService {
  constructor(private readonly prisma: PrismaService) {}

  async createAuction(
    auctionData: CreateAuctionDTO,
    ownerId: number,
  ): Promise<Auction> {
    const createdAuction = await this.prisma.auction.create({
      data: {
        ...auctionData,
        owner: { connect: { id: ownerId } },
      },
    });

    return createdAuction;
  }

  async getAuctionById(auctionId: number): Promise<Auction> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  async getAuctionByIdd(
    auctionId: number,
    userId: number,
  ): Promise<{ auction: Auction }> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: true }, // Ensure bids are included
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Sort bids by amount in descending order
    auction.bids.sort((a, b) => b.amount - a.amount);

    const userBids = auction.bids.filter((bid) => bid.bidderId === userId);
    let status = auction.status;

    if (userBids.length > 0) {
      const highestBid = auction.bids[0];
      const isWinning = highestBid?.bidderId === userId;
      status = isWinning ? 'Winning' : 'Outbid';
    }

    // Update status in auction object
    auction.status = status;

    return { auction };
  }

  async editAuction(
    auctionId: number,
    ownerId: number,
    dto: EditAuctionDTO,
  ): Promise<Auction> {
    const existingAuction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { owner: true },
    });

    if (!existingAuction) {
      throw new NotFoundException('Auction not found');
    }

    if (existingAuction.ownerId !== ownerId) {
      throw new ForbiddenException('You are not allowed to edit this auction');
    }

    if (existingAuction.status === 'Done') {
      throw new ForbiddenException('You are not allowed to edit this auction');
    }

    const updatedAuction = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { ...dto },
    });

    return updatedAuction;
  }

  async deleteAuction(auctionId: number, ownerId: number): Promise<void> {
    const existingAuction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { owner: true },
    });

    if (!existingAuction) {
      throw new NotFoundException('Auction not found');
    }

    if (existingAuction.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not allowed to delete this auction',
      );
    }

    if (existingAuction.status === 'Done') {
      throw new ForbiddenException(
        'You are not allowed to delete this auction',
      );
    }

    if (existingAuction.image) {
      const imagePath = join('./files', existingAuction.image);
      if (existsSync(imagePath)) {
        unlinkSync(imagePath);
      }
    }

    await this.prisma.auction.delete({
      where: { id: auctionId },
    });
  }

  async getAllActiveAuctions(): Promise<Auction[]> {
    // In progress = active auctions
    const auctions = await this.prisma.auction.findMany({
      where: {
        status: 'In progress',
      },
    });

    // Sort auctions by endTime (from shortest to longest time)
    const sortedAuctions = auctions.sort((a, b) => {
      const endTimeA = new Date(a.endTime).getTime();
      const endTimeB = new Date(b.endTime).getTime();

      // Compare remaining times
      return endTimeA - endTimeB;
    });

    return sortedAuctions;
  }

  async getAllActiveAuctionsExceptCurrentUser(
    userId: number,
  ): Promise<Auction[]> {
    // Fetch all auctions that are not marked as 'Done' and are not owned by the current user
    const auctions = await this.prisma.auction.findMany({
      where: {
        status: { not: 'Done' },
        NOT: { ownerId: userId },
      },
    });

    // Check each auction's bid status
    const updatedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        // Fetch bids for the current auction
        const bids = await this.prisma.bid.findMany({
          where: { auctionId: auction.id },
        });

        // Determine the status of the auction for the current user
        const userBid = bids.find((bid) => bid.bidderId === userId);
        let updatedStatus = 'In progress'; // Default status

        if (userBid) {
          // Check if the user is the winning bidder
          const highestBid = Math.max(...bids.map((bid) => bid.amount));
          if (userBid.amount === highestBid) {
            updatedStatus = 'Winning';
          } else {
            updatedStatus = 'Outbid';
          }
        }

        // Return the auction with the updated status
        return {
          ...auction,
          status: updatedStatus,
        };
      }),
    );

    // Sort auctions by remaining endTime (from shortest to longest time)
    const sortedAuctions = updatedAuctions.sort((a, b) => {
      const endTimeA = new Date(a.endTime).getTime();
      const endTimeB = new Date(b.endTime).getTime();

      // Compare remaining times
      return endTimeA - endTimeB;
    });

    return sortedAuctions;
  }

  async getLatestAuctions(): Promise<Auction[]> {
    return this.prisma.auction.findMany({
      where: {
        status: 'In progress',
      },
      orderBy: {
        id: 'desc',
      },
      take: 4,
    });
  }

  async findAuctionImage(auctionId: number): Promise<string> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      select: { image: true },
    });

    if (!auction || !auction.image) {
      throw new NotFoundException('Image not found');
    }

    return auction.image;
  }

  async updateAuctionImageId(
    auctionId: number,
    image: string,
  ): Promise<Auction> {
    return this.editAuction(auctionId, null, { image });
  }

  async removeAuctionImage(auctionId: number): Promise<void> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      select: { image: true },
    });

    if (!auction || !auction.image) {
      throw new NotFoundException('Image not found');
    }

    const imagePath = join('./files', auction.image);
    if (existsSync(imagePath)) {
      unlinkSync(imagePath);
    }

    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { image: null },
    });
  }

  async getLast10BidsForAuction(auctionId: number) {
    const bids = await this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { amount: 'desc' },
      take: 1000,
      include: {
        bidder: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return bids.map((bid) => ({
      id: bid.id,
      amount: bid.amount,
      auctionId: bid.auctionId,
      bidderId: bid.bidderId,
      createdAt: bid.createdAt,
      firstName: bid.bidder.firstName,
      lastName: bid.bidder.lastName,
      avatar: bid.bidder.avatar,
    }));
  }

  async getBiddingAuctions(userId: number): Promise<Auction[]> {
    const auctions = await this.prisma.auction.findMany({
      where: {
        bids: {
          some: {
            bidderId: userId,
          },
        },
        status: 'In progress',
        NOT: {
          ownerId: userId,
        },
      },
      include: {
        bids: {
          orderBy: {
            amount: 'desc',
          },
        },
      },
    });

    const biddingAuc = auctions.map((auction) => {
      const highestBid = auction.bids[0];
      const isWinning = highestBid?.bidderId === userId;
      return {
        ...auction,
        status: isWinning ? 'Winning' : 'Outbid',
      };
    });

    // Sort auctions by remaining endTime (from shortest to longest time)
    const sortedAuctions = biddingAuc.sort((a, b) => {
      const endTimeA = new Date(a.endTime).getTime();
      const endTimeB = new Date(b.endTime).getTime();

      // Compare remaining times
      return endTimeA - endTimeB;
    });

    return sortedAuctions;
  }

  async getWonAuctions(userId: number): Promise<Auction[]> {
    // Retrieve auctions where the status is 'Done' and the user is not the owner
    const doneAuctions = await this.prisma.auction.findMany({
      where: {
        status: 'Done',
        ownerId: {
          not: userId,
        },
      },
      include: {
        bids: true,
      },
    });

    // Filter auctions where the user is the highest bidder
    const wonAuctions = doneAuctions.filter((auction) => {
      if (auction.bids.length === 0) return false; // No bids for this auction

      // Find the highest bid
      const highestBid = auction.bids.reduce((prev, current) => {
        return prev.amount > current.amount ? prev : current;
      });

      // Check if the highest bid belongs to the user
      return highestBid.bidderId === userId;
    });

    // Sort auctions by remaining endTime (from shortest to longest time)
    const sortedAuctions = wonAuctions.sort((a, b) => {
      const endTimeA = new Date(a.endTime).getTime();
      const endTimeB = new Date(b.endTime).getTime();

      // Compare remaining times
      return endTimeA - endTimeB;
    });

    return sortedAuctions;
  }

  async getAuctionsByOwner(ownerId: number): Promise<Auction[]> {
    return this.prisma.auction.findMany({
      where: { ownerId },
    });
  }

  // @Cron('0 0 * * *') // This runs every midnight
  // async updateAuctionStatus(): Promise<void> {
  //   const now = new Date();

  //   await this.prisma.auction.updateMany({
  //     where: {
  //       endTime: {
  //         lt: now,
  //       },
  //       status: 'In progress',
  //     },
  //     data: {
  //       status: 'Done',
  //     },
  //   });
  // }

  @Cron('* * * * *') // This runs every minute
  async updateAuctionStatus(): Promise<void> {
    const now = new Date();

    await this.prisma.auction.updateMany({
      where: {
        endTime: {
          lt: now,
        },
        status: 'In progress',
      },
      data: {
        status: 'Done',
      },
    });
  }
}
