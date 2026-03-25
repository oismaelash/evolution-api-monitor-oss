import { prisma } from '@monitor/database';
import { AppError, ErrorType, updateProfileDisplayNameSchema } from '@monitor/shared';

export const UserService = {
  async updateDisplayName(userId: string, body: unknown) {
    const parsed = updateProfileDisplayNameSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(ErrorType.UNKNOWN, 'Invalid name', 400, {
        issues: parsed.error.flatten(),
      });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorType.UNKNOWN, 'User not found', 404);
    }
    await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
    });
  },
};
