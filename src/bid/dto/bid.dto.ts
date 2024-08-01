// bid.dto.ts
import { IsNumber } from 'class-validator';

export class BidDTO {
  @IsNumber()
  auctionId: number;
}
