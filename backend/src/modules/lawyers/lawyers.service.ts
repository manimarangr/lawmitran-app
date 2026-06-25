import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateLawyerProfileDto } from './dto/create-lawyer-profile.dto';
import { ReviewLawyerDto } from './dto/review-lawyer.dto';
import { SearchLawyersDto } from './dto/search-lawyers.dto';
import { UpdateLawyerProfileDto } from './dto/update-lawyer-profile.dto';

export interface LawyerProfileFiles {
  certificate?: Express.Multer.File[];
  identityCard?: Express.Multer.File[];
}

const PUBLIC_SELECT = {
  id: true,
  fullName: true,
  barCouncilState: true,
  practiceAreas: true,
  experienceYears: true,
  city: true,
  profileImageUrl: true,
  verificationStatus: true,
  createdAt: true,
} satisfies Prisma.LawyerSelect;

@Injectable()
export class LawyersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mail: MailService,
  ) {}

  async createProfile(
    userId: string,
    dto: CreateLawyerProfileDto,
    files: LawyerProfileFiles,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.LAWYER) {
      throw new ForbiddenException(
        'Only users registered with the lawyer role can create a profile',
      );
    }

    const existing = await this.prisma.lawyer.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException(
        'Lawyer profile already exists for this user',
      );
    }

    const certificateFile = files.certificate?.[0];
    if (!certificateFile) {
      throw new BadRequestException('Bar council certificate is required');
    }

    const certificateImageUrl = await this.storage.upload(
      certificateFile,
      'certificates',
    );
    const identityFile = files.identityCard?.[0];
    const identityCardImageUrl = identityFile
      ? await this.storage.upload(identityFile, 'identity-cards')
      : undefined;

    // trialEndDate is non-nullable but the trial only actually starts once an
    // admin approves the profile (see review()) — this is just a placeholder.
    const placeholderTrialEnd = new Date();
    placeholderTrialEnd.setDate(placeholderTrialEnd.getDate() + 30);

    const lawyer = await this.prisma.lawyer.create({
      data: {
        userId,
        fullName: dto.fullName,
        barCouncilNumber: dto.barCouncilNumber,
        barCouncilState: dto.barCouncilState,
        practiceAreas: dto.practiceAreas,
        experienceYears: dto.experienceYears,
        city: dto.city,
        certificateImageUrl,
        identityCardImageUrl,
        trialEndDate: placeholderTrialEnd,
      },
    });

    await this.prisma.verification.createMany({
      data: [
        {
          lawyerId: lawyer.id,
          documentType: 'BAR_COUNCIL_CERTIFICATE',
          documentUrl: certificateImageUrl,
        },
        ...(identityCardImageUrl
          ? [
              {
                lawyerId: lawyer.id,
                documentType: 'ID_CARD',
                documentUrl: identityCardImageUrl,
              },
            ]
          : []),
      ],
    });

    return lawyer;
  }

  async getOwnProfile(userId: string) {
    const lawyer = await this.prisma.lawyer.findUnique({ where: { userId } });
    if (!lawyer) {
      throw new NotFoundException('Lawyer profile not found');
    }
    return lawyer;
  }

  async updateOwnProfile(userId: string, dto: UpdateLawyerProfileDto) {
    const lawyer = await this.prisma.lawyer.findUnique({ where: { userId } });
    if (!lawyer) {
      throw new NotFoundException('Lawyer profile not found');
    }
    return this.prisma.lawyer.update({ where: { userId }, data: dto });
  }

  async search(query: SearchLawyersDto) {
    const { city, practiceArea, page, limit } = query;
    const where: Prisma.LawyerWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      ...(practiceArea ? { practiceAreas: { has: practiceArea } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.lawyer.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lawyer.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getPublicProfile(id: string) {
    const lawyer = await this.prisma.lawyer.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!lawyer || lawyer.verificationStatus !== VerificationStatus.APPROVED) {
      throw new NotFoundException('Lawyer not found');
    }
    return lawyer;
  }

  listPending() {
    return this.prisma.lawyer.findMany({
      where: {
        verificationStatus: {
          in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(adminUserId: string, lawyerId: string, dto: ReviewLawyerDto) {
    const lawyer = await this.prisma.lawyer.findUnique({
      where: { id: lawyerId },
      include: { user: true },
    });
    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    const now = new Date();
    const data: Prisma.LawyerUpdateInput = {
      verificationStatus: dto.status,
      approvedBy: adminUserId,
      approvedAt: now,
    };

    if (dto.status === VerificationStatus.APPROVED) {
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      data.trialStartDate = now;
      data.trialEndDate = trialEndDate;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.lawyer.update({ where: { id: lawyerId }, data }),
      this.prisma.verification.updateMany({
        where: {
          lawyerId,
          status: {
            in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
          },
        },
        data: {
          status: dto.status,
          reviewedBy: adminUserId,
          reviewedAt: now,
          comments: dto.comments,
        },
      }),
    ]);

    if (dto.status === VerificationStatus.APPROVED) {
      await this.mail.sendLawyerApproved(lawyer.user.email);
    }

    return updated;
  }
}
