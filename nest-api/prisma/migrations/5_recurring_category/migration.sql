-- AlterTable
ALTER TABLE `Recurrings` ADD COLUMN `categoryID` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `Recurrings_categoryID_fkey` ON `Recurrings`(`categoryID`);

-- AddForeignKey
ALTER TABLE `Recurrings` ADD CONSTRAINT `Recurrings_categoryID_fkey` FOREIGN KEY (`categoryID`) REFERENCES `Categories`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;
