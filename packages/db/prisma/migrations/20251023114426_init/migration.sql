/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `s3Url` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "s3Url" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."File";
