-- CreateEnum
CREATE TYPE "EvolutionFlavor" AS ENUM ('EVOLUTION_V2', 'EVOLUTION_GO');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "evolutionFlavor" "EvolutionFlavor" NOT NULL DEFAULT 'EVOLUTION_V2';
