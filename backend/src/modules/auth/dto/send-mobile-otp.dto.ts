import { IsString, MinLength } from 'class-validator';

export class SendMobileOtpDto {
  @IsString()
  @MinLength(10)
  mobile: string;
}
