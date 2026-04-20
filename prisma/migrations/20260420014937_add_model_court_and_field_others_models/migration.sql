/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('CIVIL', 'PENAL', 'LABORAL', 'FAMILIA', 'ADMINISTRATIVO', 'COMERCIAL', 'CONSTITUCIONAL');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "courtId" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Cartagena',
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Colombia',
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'Bolivar',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'NATURAL',
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "courts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CourtType" NOT NULL,
    "judgeName" TEXT,
    "judgePhone" TEXT,
    "judgeEmail" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Colombia',
    "address" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courts_type_idx" ON "courts"("type");

-- CreateIndex
CREATE INDEX "courts_city_idx" ON "courts"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
