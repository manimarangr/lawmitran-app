import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { MailService } from '../../common/mail/mail.service';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import { SmsService } from '../../common/sms/sms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

const EMAIL_VERIFICATION_TTL_HOURS = 24;
const MOBILE_OTP_TTL_MINUTES = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private recaptcha: RecaptchaService,
    private mail: MailService,
    private sms: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot self-register as admin');
    }

    const captchaValid = await this.recaptcha.verify(dto.captchaToken);
    if (!captchaValid) {
      throw new BadRequestException('Captcha verification failed');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { mobile: dto.mobile }] },
    });
    if (existing) {
      throw new BadRequestException('Email or mobile already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = randomUUID();
    const emailVerificationExpiresAt = new Date();
    emailVerificationExpiresAt.setHours(
      emailVerificationExpiresAt.getHours() + EMAIL_VERIFICATION_TTL_HOURS,
    );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        mobile: dto.mobile,
        passwordHash,
        role: dto.role,
        emailVerificationToken,
        emailVerificationExpiresAt,
      },
    });

    await this.mail.sendEmailVerification(user.email, emailVerificationToken);

    if (user.role === Role.LAWYER) {
      await this.sendMobileOtp(user.mobile);
    }

    return {
      userId: user.id,
      emailVerificationRequired: true,
      mobileVerificationRequired: user.role === Role.LAWYER,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }
    if (user.role === Role.LAWYER && !user.mobileVerified) {
      throw new ForbiddenException(
        'Please verify your mobile number before logging in',
      );
    }
    return this.issueTokens(user.id, user.role);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true };
  }

  async sendMobileOtp(mobile: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      throw new NotFoundException('No account found for this mobile number');
    }
    if (user.role !== Role.LAWYER) {
      throw new BadRequestException(
        'Mobile verification only applies to lawyer accounts',
      );
    }
    if (user.mobileVerified) {
      throw new ConflictException('Mobile number is already verified');
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + MOBILE_OTP_TTL_MINUTES);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mobileOtpCode: code, mobileOtpExpiresAt: expiresAt },
    });

    await this.sms.sendOtp(mobile, code);

    return { success: true };
  }

  async verifyMobileOtp(mobile: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (
      !user ||
      user.mobileOtpCode !== code ||
      !user.mobileOtpExpiresAt ||
      user.mobileOtpExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mobileVerified: true,
        mobileOtpCode: null,
        mobileOtpExpiresAt: null,
      },
    });

    return { success: true };
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; role: string };
    try {
      payload = this.jwt.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokens(payload.sub, payload.role);
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revoked: false },
      data: { revoked: true },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken: string = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    } as JwtSignOptions);
    const refreshToken: string = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      jwtid: randomUUID(),
    } as JwtSignOptions);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
