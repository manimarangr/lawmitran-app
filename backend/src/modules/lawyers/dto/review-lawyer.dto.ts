import { VerificationStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewLawyerDto {
  @IsIn([VerificationStatus.APPROVED, VerificationStatus.REJECTED])
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  comments?: string;
}
