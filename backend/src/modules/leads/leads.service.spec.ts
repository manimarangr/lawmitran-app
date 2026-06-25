import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
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
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: {
    lawyer: { findUnique: jest.Mock };
    lead: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let mail: { sendNewLeadNotification: jest.Mock };
  let whatsapp: { sendMessage: jest.Mock };

  beforeEach(async () => {
    prisma = {
      lawyer: { findUnique: jest.fn() },
      lead: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    mail = { sendNewLeadNotification: jest.fn().mockResolvedValue(undefined) };
    whatsapp = { sendMessage: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        { provide: WhatsappService, useValue: whatsapp },
      ],
    }).compile();

    service = module.get(LeadsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      lawyerId: 'lawyer-1',
      practiceArea: 'Property Law',
      description: 'Need help with a sale deed',
    };

    it('throws if the lawyer is not approved', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({
        id: 'lawyer-1',
        verificationStatus: VerificationStatus.PENDING,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        user: { email: 'lawyer@b.com', mobile: '9999999999' },
      });

      await expect(service.create('client-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if the lawyer subscription is expired', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({
        id: 'lawyer-1',
        verificationStatus: VerificationStatus.APPROVED,
        subscriptionStatus: SubscriptionStatus.EXPIRED,
        user: { email: 'lawyer@b.com', mobile: '9999999999' },
      });

      await expect(service.create('client-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates the lead and notifies the lawyer by email and whatsapp', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({
        id: 'lawyer-1',
        verificationStatus: VerificationStatus.APPROVED,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        user: { email: 'lawyer@b.com', mobile: '9999999999' },
      });
      const created = {
        id: 'lead-1',
        ...dto,
        clientId: 'client-1',
        status: LeadStatus.NEW,
      };
      prisma.lead.create.mockResolvedValue(created);

      const result = await service.create('client-1', dto);

      expect(result).toEqual(created);
      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: {
          clientId: 'client-1',
          lawyerId: 'lawyer-1',
          practiceArea: dto.practiceArea,
          description: dto.description,
        },
      });
      expect(mail.sendNewLeadNotification).toHaveBeenCalledWith(
        'lawyer@b.com',
        dto.practiceArea,
      );
      expect(whatsapp.sendMessage).toHaveBeenCalledWith(
        '9999999999',
        expect.any(String),
      );
    });
  });

  describe('updateStatus', () => {
    it('throws if the lawyer profile does not exist', async () => {
      prisma.lawyer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('user-1', 'lead-1', {
          status: LeadStatus.CONTACTED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws if the lead does not belong to this lawyer', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({ id: 'lawyer-1' });
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        lawyerId: 'lawyer-2',
        status: LeadStatus.NEW,
      });

      await expect(
        service.updateStatus('user-1', 'lead-1', {
          status: LeadStatus.CONTACTED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws on a backwards or no-op status transition', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({ id: 'lawyer-1' });
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        lawyerId: 'lawyer-1',
        status: LeadStatus.CLOSED,
      });

      await expect(
        service.updateStatus('user-1', 'lead-1', {
          status: LeadStatus.CONTACTED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('advances the lead status forward', async () => {
      prisma.lawyer.findUnique.mockResolvedValue({ id: 'lawyer-1' });
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        lawyerId: 'lawyer-1',
        status: LeadStatus.NEW,
      });
      const updated = { id: 'lead-1', status: LeadStatus.CONTACTED };
      prisma.lead.update.mockResolvedValue(updated);

      const result = await service.updateStatus('user-1', 'lead-1', {
        status: LeadStatus.CONTACTED,
      });

      expect(result).toEqual(updated);
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { status: LeadStatus.CONTACTED },
      });
    });
  });
});
