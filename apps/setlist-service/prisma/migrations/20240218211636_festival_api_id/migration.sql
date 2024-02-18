/*
  Warnings:

  - A unique constraint covering the columns `[jambaseId]` on the table `Festival` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jambaseId` to the `Festival` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Festival` ADD COLUMN `jambaseId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Festival_jambaseId_key` ON `Festival`(`jambaseId`);
