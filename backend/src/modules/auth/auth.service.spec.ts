import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../common/mail/mail.service';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import { SmsService } from '../../common/sms/sms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let recaptcha: { verify: jest.Mock };
  let mail: { sendEmailVerification: jest.Mock };
  let sms: { sendOtp: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    recaptcha = { verify: jest.fn().mockResolvedValue(true) };
    mail = { sendEmailVerification: jest.fn().mockResolvedValue(undefined) };
    sms = { sendOtp: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verify: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: RecaptchaService, useValue: recaptcha },
        { provide: MailService, useValue: mail },
        { provide: SmsService, useValue: sms },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('rejects captcha failure before touching the database', async () => {
      recaptcha.verify.mockResolvedValue(false);

      await expect(
        service.register({
          email: 'a@b.com',
          mobile: '9999999999',
          password: 'password123',
          role: Role.CLIENT,
          captchaToken: 'bad-token',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('creates a CLIENT without sending an OTP, and sends an email verification link', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        role: Role.CLIENT,
      });

      const result = await service.register({
        email: 'a@b.com',
        mobile: '9999999999',
        password: 'password123',
        role: Role.CLIENT,
        captchaToken: 'good-token',
      });

      expect(result).toEqual({
        userId: 'user-1',
        emailVerificationRequired: true,
        mobileVerificationRequired: false,
      });
      expect(mail.sendEmailVerification).toHaveBeenCalledWith(
        'a@b.com',
        expect.any(String),
      );
      expect(sms.sendOtp).not.toHaveBeenCalled();
    });

    it('creates a LAWYER and also sends a mobile OTP', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'lawyer@b.com',
        mobile: '9999999998',
        role: Role.LAWYER,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        role: Role.LAWYER,
        mobileVerified: false,
      });

      const result = await service.register({
        email: 'lawyer@b.com',
        mobile: '9999999998',
        password: 'password123',
        role: Role.LAWYER,
        captchaToken: 'good-token',
      });

      expect(result.mobileVerificationRequired).toBe(true);
      expect(sms.sendOtp).toHaveBeenCalledWith(
        '9999999998',
        expect.any(String),
      );
    });
  });

  describe('login', () => {
    it('rejects unverified email', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash,
        emailVerified: false,
        role: Role.CLIENT,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects an unverified lawyer mobile even with a verified email', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash,
        emailVerified: true,
        mobileVerified: false,
        role: Role.LAWYER,
      });

      await expect(
        service.login({ email: 'lawyer@b.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('issues tokens once email (and mobile for lawyers) is verified', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash,
        emailVerified: true,
        mobileVerified: true,
        role: Role.LAWYER,
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'lawyer@b.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
    });
  });

  describe('verifyEmail', () => {
    it('rejects an unknown or expired token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marks the email verified and clears the token', async () => {
      const future = new Date(Date.now() + 60_000);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        emailVerificationExpiresAt: future,
      });

      await service.verifyEmail('good-token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      });
    });
  });

  describe('sendMobileOtp / verifyMobileOtp', () => {
    it('rejects sending an OTP for a non-lawyer account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: Role.CLIENT,
        mobileVerified: false,
      });

      await expect(service.sendMobileOtp('9999999999')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects sending an OTP when already verified', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: Role.LAWYER,
        mobileVerified: true,
      });

      await expect(service.sendMobileOtp('9999999999')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects an incorrect or expired OTP code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        mobileOtpCode: '123456',
        mobileOtpExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.verifyMobileOtp('9999999999', '000000'),
      ).rejects.toThrow(BadRequestException);
    });

    it('marks the mobile verified on a correct code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        mobileOtpCode: '123456',
        mobileOtpExpiresAt: new Date(Date.now() + 60_000),
      });

      await service.verifyMobileOtp('9999999999', '123456');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          mobileVerified: true,
          mobileOtpCode: null,
          mobileOtpExpiresAt: null,
        },
      });
    });
  });
});
