import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID of the lawyer being rated' })
  @IsUUID()
  lawyerId: string;

  @ApiProperty({
    description:
      'ID of the closed lead that proves the client engaged this lawyer',
  })
  @IsUUID()
  leadId: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
