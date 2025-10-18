/*
  Warnings:

  - You are about to drop the column `sandboxUrl` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SandboxStatus" AS ENUM ('PENDING', 'RUNNING', 'STOPPED', 'FAILED');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "sandboxUrl",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."ProjectStatus";

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "SandboxStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_projectId_key" ON "Sandbox"("projectId");

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
