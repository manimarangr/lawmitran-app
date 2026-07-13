import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  mobile: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  captchaToken: string;

  /** Terms of Use & Privacy Policy — must be accepted. */
  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms & Privacy Policy' })
  acceptTerms: boolean;

  /** DPDP consent to process personal data for verification & matching — must be accepted. */
  @IsBoolean()
  @Equals(true, { message: 'Consent to data processing is required' })
  acceptProcessing: boolean;

  /** Optional marketing communications opt-in. */
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
