import { IsString, MinLength } from 'class-validator';

export class VerifyMobileOtpDto {
  @IsString()
  @MinLength(10)
  mobile: string;

  @IsString()
  @MinLength(4)
  code: string;
}
