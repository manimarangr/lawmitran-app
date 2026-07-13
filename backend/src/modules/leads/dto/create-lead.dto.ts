import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ description: 'ID of the lawyer this lead is being sent to' })
  @IsUUID()
  lawyerId: string;

  @ApiPropertyOptional({
    example: 'Property Law',
    description: 'Omit to auto-detect from the description',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  practiceArea?: string;

  @ApiProperty({ description: 'Description of the legal requirement' })
  @IsString()
  @MinLength(10)
  description: string;
}
