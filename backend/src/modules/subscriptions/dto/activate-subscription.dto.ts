import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ActivateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'STANDARD',
    description: 'Name of the subscription plan to activate (default STANDARD)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  planName?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Subscription duration in days (default 30)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}
