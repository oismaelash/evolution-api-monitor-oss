import { prisma } from '@pilot/database';
import { AppError } from '@pilot/shared';

export const AlertService = {
  async acknowledge(userId: string, alertId: string) {
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        number: { project: { userId } },
      },
    });
    if (!alert) {
      throw new AppError('UNKNOWN', 'Alert not found', 404);
    }
    return prisma.alert.update({
      where: { id: alertId },
      data: { acknowledgedAt: new Date() },
    });
  },
};
