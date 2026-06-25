import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LeadStatus,
  SubscriptionStatus,
  VerificationStatus,
} from '@prisma/client';
import { MailService } from '../../common/mail/mail.service';
import { WhatsappService } from '../../common/whatsapp/whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

const STATUS_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.CLOSED,
];

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private whatsapp: WhatsappService,
  ) {}

  async create(clientId: string, dto: CreateLeadDto) {
    const lawyer = await this.prisma.lawyer.findUnique({
      where: { id: dto.lawyerId },
      include: { user: true },
    });
    if (!lawyer || lawyer.verificationStatus !== VerificationStatus.APPROVED) {
      throw new NotFoundException('Lawyer not found');
    }
    if (lawyer.subscriptionStatus === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException(
        'This lawyer is not currently accepting new leads',
      );
    }

    const lead = await this.prisma.lead.create({
      data: {
        clientId,
        lawyerId: lawyer.id,
        practiceArea: dto.practiceArea,
        description: dto.description,
      },
    });

    await this.mail.sendNewLeadNotification(
      lawyer.user.email,
      dto.practiceArea,
    );
    await this.whatsapp.sendMessage(
      lawyer.user.mobile,
      `New ${dto.practiceArea} lead on LawMitran. Open your dashboard to respond.`,
    );

    return lead;
  }

  listForClient(clientId: string) {
    return this.prisma.lead.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForLawyer(userId: string) {
    const lawyer = await this.getLawyerByUserId(userId);
    return this.prisma.lead.findMany({
      where: { lawyerId: lawyer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(userId: string, leadId: string, dto: UpdateLeadStatusDto) {
    const lawyer = await this.getLawyerByUserId(userId);

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.lawyerId !== lawyer.id) {
      throw new ForbiddenException('You can only update leads assigned to you');
    }

    const currentIndex = STATUS_ORDER.indexOf(lead.status);
    const nextIndex = STATUS_ORDER.indexOf(dto.status);
    if (nextIndex <= currentIndex) {
      throw new BadRequestException(
        `Cannot move lead status from ${lead.status} to ${dto.status}`,
      );
    }

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { status: dto.status },
    });
  }

  private async getLawyerByUserId(userId: string) {
    const lawyer = await this.prisma.lawyer.findUnique({ where: { userId } });
    if (!lawyer) {
      throw new NotFoundException('Lawyer profile not found');
    }
    return lawyer;
  }
}
