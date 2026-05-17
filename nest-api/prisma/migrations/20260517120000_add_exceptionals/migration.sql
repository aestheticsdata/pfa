-- CreateTable
CREATE TABLE `Exceptionals` (
    `ID` CHAR(36) NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `itemType` VARCHAR(11) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NULL,
    `categoryName` VARCHAR(50) NULL,
    `categoryColor` VARCHAR(20) NULL,
    `invoicefile` VARCHAR(255) NULL,

    INDEX `Exceptionals_userID_idx`(`userID`),
    INDEX `Exceptionals_userID_date_idx`(`userID`, `date`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
