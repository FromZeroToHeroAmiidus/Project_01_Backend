// place-bid.dto.ts
import { IsNumber, IsPositive } from 'class-validator';

export class PlaceBidDTO {
  @IsNumber()
  @IsPositive()
  amount: number;
}
