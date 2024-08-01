import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  UnauthorizedException,
  Res,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { AuctionService } from '../auction/auction.service';
import { CreateAuctionDTO } from '../auction/dto/create-auction.dto';
import { EditAuctionDTO } from '../auction/dto/edit-auction.dto';
import { Auction, User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { saveImageToStorage } from '../helpers/imageStorage';
import { join } from 'path';
import { existsSync } from 'fs';
import { Public } from '@prisma/client/runtime/library';
import { UserService } from '../user/user.service';
import { PasswordResetService } from 'src/auth/password-reset.services';
import { AuthService } from 'src/auth/auth.service';
import { SignUpDto, LoginDto } from '../auth/dto';
import { response } from 'express';
import { UpdatePasswordDto } from 'src/user/dto/update-password.dto';

@Controller('')
export class MeController {
  constructor(
    private readonly userService: UserService,
    private readonly auctionService: AuctionService,
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      await this.authService.signin(loginDto, res);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: User, @GetUser('email') email: string) {
    //console.log({ email });
    return user;
  }

  @UseGuards(JwtGuard)
  @Post('me/auction')
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDTO,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    return this.auctionService.createAuction(createAuctionDto, userId);
  }

  @UseGuards(JwtGuard)
  @Patch('me/auction/:id')
  async editAuction(
    @Param('id', ParseIntPipe) auctionId: number,
    @Body() editAuctionDto: EditAuctionDTO,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    return this.auctionService.editAuction(auctionId, userId, editAuctionDto);
  }

  @UseGuards(JwtGuard)
  @Delete('me/auction/:id')
  async deleteAuction(
    @Param('id', ParseIntPipe) auctionId: number,
    @Body() editAuctionDto: EditAuctionDTO,
    @GetUser('id') userId: number,
  ): Promise<Auction> {
    return this.auctionService.editAuction(auctionId, userId, editAuctionDto);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('me/update-password')
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.userService.changePassword(userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
    };
  }

  /*
/signup done 

Sign up to the system (username, password)

/login done

Logs in an existing user with a password

/me done

Get the currently logged in user information

/me/auction done

Post your auction

/me/auction/:id done

Update your auction (you can update only your auctions)

/me/update-password done

Update the current users password
  */
}
