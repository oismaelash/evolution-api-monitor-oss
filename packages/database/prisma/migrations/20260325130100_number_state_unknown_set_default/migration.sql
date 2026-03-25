-- AlterTable (separate migration so ADD VALUE is committed first)
ALTER TABLE "Number" ALTER COLUMN "state" SET DEFAULT 'UNKNOWN';
