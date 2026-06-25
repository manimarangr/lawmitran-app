import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: {
    lead: { findUnique: jest.Mock };
    rating: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      aggregate: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      lead: { findUnique: jest.fn() },
      rating: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [RatingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RatingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      lawyerId: 'lawyer-1',
      leadId: 'lead-1',
      score: 5,
      comment: 'Great',
    };

    it('throws if the lead does not belong to the client and lawyer', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        clientId: 'someone-else',
        lawyerId: 'lawyer-1',
        status: LeadStatus.CLOSED,
      });

      await expect(service.create('client-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws if the lead is not closed yet', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
        status: LeadStatus.NEW,
      });

      await expect(service.create('client-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if the lead has already been rated', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
        status: LeadStatus.CLOSED,
      });
      prisma.rating.findUnique.mockResolvedValue({ id: 'rating-1' });

      await expect(service.create('client-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates the rating when the lead is closed and unrated', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
        status: LeadStatus.CLOSED,
      });
      prisma.rating.findUnique.mockResolvedValue(null);
      const created = { id: 'rating-1', ...dto, clientId: 'client-1' };
      prisma.rating.create.mockResolvedValue(created);

      const result = await service.create('client-1', dto);

      expect(result).toEqual(created);
      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: {
          leadId: 'lead-1',
          lawyerId: 'lawyer-1',
          clientId: 'client-1',
          score: 5,
          comment: 'Great',
        },
      });
    });
  });

  describe('listForLawyer', () => {
    it('returns ratings with the aggregate average and count', async () => {
      prisma.rating.findMany.mockResolvedValue([{ id: 'rating-1', score: 5 }]);
      prisma.rating.aggregate.mockResolvedValue({
        _avg: { score: 4.5 },
        _count: 2,
      });

      const result = await service.listForLawyer('lawyer-1');

      expect(result).toEqual({
        ratings: [{ id: 'rating-1', score: 5 }],
        averageScore: 4.5,
        totalRatings: 2,
      });
    });

    it('defaults averageScore to 0 when there are no ratings', async () => {
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.rating.aggregate.mockResolvedValue({
        _avg: { score: null },
        _count: 0,
      });

      const result = await service.listForLawyer('lawyer-1');

      expect(result.averageScore).toBe(0);
      expect(result.totalRatings).toBe(0);
    });
  });
});
