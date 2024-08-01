import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
} from 'class-validator';

export class CreateAuctionDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  image: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  startingBid: number;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endTime: Date;

  @Type(() => Number)
  currentBid: number;

  constructor() {
    this.currentBid = this.startingBid;
  }
}
