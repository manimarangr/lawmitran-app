import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateRatingDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead || lead.clientId !== clientId || lead.lawyerId !== dto.lawyerId) {
      throw new ForbiddenException(
        'You can only rate a lawyer you have an existing lead with',
      );
    }
    if (lead.status !== LeadStatus.CLOSED) {
      throw new BadRequestException(
        'You can only rate a lawyer after the lead is closed',
      );
    }

    const existing = await this.prisma.rating.findUnique({
      where: { leadId: dto.leadId },
    });
    if (existing) {
      throw new ConflictException('This lead has already been rated');
    }

    return this.prisma.rating.create({
      data: {
        leadId: dto.leadId,
        lawyerId: dto.lawyerId,
        clientId,
        score: dto.score,
        comment: dto.comment,
      },
    });
  }

  async listForLawyer(lawyerId: string) {
    const [ratings, aggregate] = await Promise.all([
      this.prisma.rating.findMany({
        where: { lawyerId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.aggregate({
        where: { lawyerId },
        _avg: { score: true },
        _count: true,
      }),
    ]);

    return {
      ratings,
      averageScore: aggregate._avg.score ?? 0,
      totalRatings: aggregate._count,
    };
  }
}
