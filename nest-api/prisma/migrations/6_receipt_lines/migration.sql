-- CreateTable
CREATE TABLE `ReceiptLines` (
    `ID` CHAR(36) NOT NULL,
    `spendingID` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(6, 2) NOT NULL,

    INDEX `ReceiptLines_spendingID_idx`(`spendingID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReceiptLines` ADD CONSTRAINT `ReceiptLines_spendingID_fkey` FOREIGN KEY (`spendingID`) REFERENCES `Spendings`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

