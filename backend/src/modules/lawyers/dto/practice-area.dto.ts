import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PracticeAreaDto {
  @ApiProperty({ example: 'Environmental Law' })
  @IsString()
  @MinLength(2)
  name: string;
}
