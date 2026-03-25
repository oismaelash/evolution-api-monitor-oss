-- AlterEnum
ALTER TYPE "NumberState" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "Number" ALTER COLUMN "state" SET DEFAULT 'UNKNOWN';
