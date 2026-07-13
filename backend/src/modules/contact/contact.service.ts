import { Injectable, NotFoundException } from '@nestjs/common';
import { MailService } from '../../common/mail/mail.service';
import { NotifyService } from '../../common/notify/notify.service';
import { paginate, resolvePagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactQueryDto } from './dto/create-contact-query.dto';
import { ResolveContactQueryDto } from './dto/resolve-contact-query.dto';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private notify: NotifyService,
  ) {}

  async create(dto: CreateContactQueryDto, userId?: string) {
    const query = await this.prisma.contactQuery.create({
      data: {
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile ?? null,
        category: dto.category,
        subject: dto.subject ?? null,
        message: dto.message,
        userId: userId ?? null,
      },
    });

    // Notify the support inbox — failures never block the submission.
    try {
      await this.mail.sendContactQueryNotification(
        dto.category,
        dto.name,
        dto.email,
        dto.subject ?? null,
      );
    } catch {
      /* logged inside MailService */
    }

    await this.notify.notifyAdmins('CLIENT_QUERY', {
      title: `New client query: ${dto.category.replace(/_/g, ' ').toLowerCase()}`,
      body: `${dto.name} <${dto.email}>${dto.subject ? ` — ${dto.subject}` : ''}`,
      link: '/admin/queries',
    });

    return { id: query.id, received: true };
  }

  async list(
    status?: 'OPEN' | 'RESOLVED',
    q?: string,
    page?: string | number,
    pageSize?: string | number,
  ) {
    const query = q?.trim();
    const where = {
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
              { subject: { contains: query, mode: 'insensitive' as const } },
              { message: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const pg = resolvePagination(page, pageSize);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactQuery.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: pg.skip,
        take: pg.take,
      }),
      this.prisma.contactQuery.count({ where }),
    ]);
    return paginate(items, total, pg.page, pg.pageSize);
  }

  async update(id: string, dto: ResolveContactQueryDto) {
    const query = await this.prisma.contactQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundException('Query not found');
    return this.prisma.contactQuery.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote } : {}),
      },
    });
  }
}
