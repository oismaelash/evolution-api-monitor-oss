-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "alertEmail" TEXT,
ADD COLUMN     "smtpFrom" TEXT;

-- AlterTable
ALTER TABLE "Number" ADD COLUMN     "restartAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "pastDueGraceEndsAt" TIMESTAMP(3);
