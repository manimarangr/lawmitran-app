import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ description: 'ID of the lawyer this lead is being sent to' })
  @IsUUID()
  lawyerId: string;

  @ApiProperty({ example: 'Property Law' })
  @IsString()
  @MinLength(2)
  practiceArea: string;

  @ApiProperty({ description: 'Description of the legal requirement' })
  @IsString()
  @MinLength(10)
  description: string;
}
