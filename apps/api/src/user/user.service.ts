import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUser(internalUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: internalUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateUser(
    internalUserId: string,
    data: { displayName?: string; avatarUrl?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: internalUserId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  async deleteUser(internalUserId: string) {
    await this.prisma.user.delete({ where: { id: internalUserId } });
    this.logger.warn(`User ${internalUserId} deleted`);
  }
}
