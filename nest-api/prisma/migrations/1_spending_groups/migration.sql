-- AlterTable
ALTER TABLE `Spendings` ADD COLUMN `detail` VARCHAR(100) NULL,
    ADD COLUMN `groupID` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `SpendingGroups` (
    `ID` CHAR(36) NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `label` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Spendings_groupID_fkey` ON `Spendings`(`groupID`);

-- AddForeignKey
ALTER TABLE `Spendings` ADD CONSTRAINT `Spendings_groupID_fkey` FOREIGN KEY (`groupID`) REFERENCES `SpendingGroups`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

