import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: [LeadStatus.CONTACTED, LeadStatus.CLOSED] })
  @IsIn([LeadStatus.CONTACTED, LeadStatus.CLOSED])
  status: LeadStatus;
}
