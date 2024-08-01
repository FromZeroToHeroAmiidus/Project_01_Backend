import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Response,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionDTO } from './dto/create-auction.dto';
import { EditAuctionDTO } from './dto/edit-auction.dto';
import { Auction } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { saveImageToStorage } from '../helpers/imageStorage';
import { join } from 'path';
import { existsSync } from 'fs';
import { Public } from '@prisma/client/runtime/library';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  // @UseGuards(JwtGuard)
  @Get('latest')
  async getLatestAuctions(): Promise<Auction[]> {
    return this.auctionService.getLatestAuctions();
  }

  //////////////////////////////

  @UseGuards(JwtGuard)
  @Get('user')
  async getAuctionsByOwner(@GetUser('id') userId: string): Promise<Auction[]> {
    return this.auctionService.getAuctionsByOwner(parseInt(userId, 10));
  }
  @UseGuards(JwtGuard)
  @Get('bidding')
  async getBiddingAuctions(@GetUser('id') userId: string): Promise<Auction[]> {
    const userIdInt = parseInt(userId, 10);
    console.log('Fetching bidding auctions for user ID:', userIdInt);
    const auctions = await this.auctionService.getBiddingAuctions(userIdInt);
    console.log('Auctions found:', auctions);
    return auctions;
  }

  @UseGuards(JwtGuard)
  @Get('won')
  async getWonAuctions(@GetUser('id') userId: string): Promise<Auction[]> {
    return this.auctionService.getWonAuctions(parseInt(userId, 10));
  }
  /////////////////////

  @UseGuards(JwtGuard)
  @Post('create')
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDTO,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    return this.auctionService.createAuction(createAuctionDto, userId);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async editAuction(
    @Param('id', ParseIntPipe) auctionId: number,
    @Body() editAuctionDto: EditAuctionDTO,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    return this.auctionService.editAuction(auctionId, userId, editAuctionDto);
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async getAuctionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Auction> {
    return this.auctionService.getAuctionById(id);
  }

  @UseGuards(JwtGuard)
  @Get('me/:id')
  async getAuctionByIdd(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number, // Use the custom decorator to get the user ID
  ): Promise<{ auction: Auction }> {
    return this.auctionService.getAuctionByIdd(id, userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteAuction(
    @Param('id', ParseIntPipe) auctionId: number,
    @GetUser('id') userId: number,
  ): Promise<void> {
    return this.auctionService.deleteAuction(auctionId, userId);
  }

  @UseGuards(JwtGuard)
  @Get('active')
  async getAllActiveAuctions(): Promise<Auction[]> {
    return this.auctionService.getAllActiveAuctions();
  }

  @UseGuards(JwtGuard)
  @Get('active/other-users')
  async getAllActiveAuctionsExceptCurrentUser(
    @GetUser('id') userId: number,
  ): Promise<Auction[]> {
    return this.auctionService.getAllActiveAuctionsExceptCurrentUser(userId);
  }

  //@UseGuards(JwtGuard)
  @Get('image/:id')
  async findImage(
    @Param('id', ParseIntPipe) auctionId: number,
    @Response() res,
  ): Promise<void> {
    const imageName = await this.auctionService.findAuctionImage(auctionId);
    console.log('IMAGE NAME : ' + imageName);

    const isValidImage = /\.(jpg|jpeg|png|gif)$/.test(imageName);
    if (!isValidImage || imageName === '') {
      console.log('Tle sm ... ni slike');
      return res.sendFile('empty_auction_image.png', {
        root: './files/error',
      });
    }

    console.log('Auction image : ' + imageName);
    if (!imageName || imageName === null || imageName === undefined) {
      //res.status(HttpStatus.NOT_FOUND).send('Image not found');
      //return;
      console.log('Tle sm ... ni slike');
      return res.sendFile('papak.jpg', {
        root: './files',
      });
    }
    const imagePath = join('./files', imageName);
    console.log('Naslov v celoti : ' + imagePath);
    return res.sendFile(imageName, {
      root: './files',
    });
  }

  @UseGuards(JwtGuard)
  @Delete('image/:id')
  @HttpCode(HttpStatus.OK)
  async removeImage(
    @Param('id', ParseIntPipe) auctionId: number,
    @Response() res,
  ): Promise<void> {
    try {
      await this.auctionService.removeAuctionImage(auctionId);
      res.status(HttpStatus.OK).send('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to remove image');
    }
  }

  @UseGuards(JwtGuard)
  @Patch('upload/:id')
  @UseInterceptors(FileInterceptor('image', saveImageToStorage))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseIntPipe) auctionId: number,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    const filename = file?.filename;
    if (!filename)
      throw new BadRequestException('File must be a png, jpg/jpeg');

    const auction = await this.auctionService.editAuction(auctionId, userId, {
      image: filename,
    });
    return auction;
  }

  @UseGuards(JwtGuard)
  @Get(':id/bids')
  async getLast10Bids(@Param('id') id: string) {
    return this.auctionService.getLast10BidsForAuction(Number(id));
  }
}
