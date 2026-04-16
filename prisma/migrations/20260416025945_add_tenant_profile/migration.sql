-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "npwp" TEXT,
ADD COLUMN     "officeAddress" TEXT,
ADD COLUMN     "phone" TEXT;
