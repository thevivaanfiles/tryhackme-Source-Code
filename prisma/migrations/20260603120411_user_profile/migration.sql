-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('ASE', 'BT', 'CH', 'CV', 'CSE', 'AIML', 'CY', 'CD', 'EEE', 'ECE', 'EIE', 'IEM', 'ISE', 'ME', 'ETE');

-- CreateEnum
CREATE TYPE "Year" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarPath" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "branch" "Branch",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "usn" TEXT,
ADD COLUMN     "year" "Year";

-- CreateIndex
CREATE UNIQUE INDEX "User_usn_key" ON "User"("usn");

