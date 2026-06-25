import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class SetPlanPriceDto {
  @ApiProperty({ example: 1000, description: 'Monthly price for this plan' })
  @IsNumber()
  @Min(0)
  amount: number;
}
