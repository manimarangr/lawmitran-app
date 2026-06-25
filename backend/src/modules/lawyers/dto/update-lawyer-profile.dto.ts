import { PartialType } from '@nestjs/swagger';
import { CreateLawyerProfileDto } from './create-lawyer-profile.dto';

export class UpdateLawyerProfileDto extends PartialType(
  CreateLawyerProfileDto,
) {}
