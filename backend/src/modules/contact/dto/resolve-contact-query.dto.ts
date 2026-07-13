import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveContactQueryDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'RESOLVED'] })
  @IsOptional()
  @IsIn(['OPEN', 'RESOLVED'])
  status?: 'OPEN' | 'RESOLVED';

  @ApiPropertyOptional({ example: 'Refund processed via Razorpay on 10 Jul' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
