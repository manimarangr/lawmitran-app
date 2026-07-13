import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotifyPayload {
  title: string;
  body?: string;
  /** In-app route the notification should open, e.g. /admin/approvals/:id */
  link?: string;
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(private prisma: PrismaService) {}

  /** In-app notification for a single user. */
  async notifyUser(userId: string, type: string, payload: NotifyPayload) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          channel: NotificationChannel.IN_APP,
          type,
          payloadJson: payload as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Notifications must never break the main flow.
      this.logger.warn(`notifyUser failed: ${(err as Error).message}`);
    }
  }

  /** In-app notification for every active admin. */
  async notifyAdmins(type: string, payload: NotifyPayload) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
        select: { id: true },
      });
      if (admins.length === 0) return;
      await this.prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          channel: NotificationChannel.IN_APP,
          type,
          payloadJson: payload as unknown as Prisma.InputJsonValue,
        })),
      });
    } catch (err) {
      this.logger.warn(`notifyAdmins failed: ${(err as Error).message}`);
    }
  }
}
