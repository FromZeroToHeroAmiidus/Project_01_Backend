import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsNotEmpty,
} from 'class-validator';

export class EditAuctionDTO {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  // startingBid?: number;

  // @IsDate()
  // @IsOptional()
  // // @IsNotEmpty()
  // endTime?: Date;
  @IsNumber()
  @IsOptional()
  // @IsNotEmpty()
  currentBid?: number;
}
