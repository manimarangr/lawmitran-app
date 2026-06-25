import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @ApiBearerAuth()
  @Roles(Role.CLIENT)
  @Post()
  @ApiOperation({ summary: 'Rate a lawyer for a closed lead' })
  @ApiResponse({ status: 201, description: 'Rating recorded' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(user.userId, dto);
  }

  @Public()
  @Get('lawyer/:lawyerId')
  @ApiOperation({ summary: "List a lawyer's ratings and average score" })
  @ApiResponse({
    status: 200,
    description: 'Ratings and aggregate score for the lawyer',
  })
  listForLawyer(@Param('lawyerId') lawyerId: string) {
    return this.ratingsService.listForLawyer(lawyerId);
  }
}
