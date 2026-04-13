/*
  Warnings:

  - You are about to drop the column `otpCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiry` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "otpCode",
DROP COLUMN "otpExpiry",
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "tokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
