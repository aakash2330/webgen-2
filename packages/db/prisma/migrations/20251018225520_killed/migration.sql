/*
  Warnings:

  - The values [STOPPED] on the enum `SandboxStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SandboxStatus_new" AS ENUM ('PENDING', 'RUNNING', 'PAUSED', 'KILLED', 'FAILED');
ALTER TABLE "public"."Sandbox" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sandbox" ALTER COLUMN "status" TYPE "SandboxStatus_new" USING ("status"::text::"SandboxStatus_new");
ALTER TYPE "SandboxStatus" RENAME TO "SandboxStatus_old";
ALTER TYPE "SandboxStatus_new" RENAME TO "SandboxStatus";
DROP TYPE "public"."SandboxStatus_old";
ALTER TABLE "Sandbox" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
