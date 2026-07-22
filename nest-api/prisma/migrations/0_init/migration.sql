-- CreateTable
CREATE TABLE `Categories` (
    `ID` CHAR(36) NOT NULL,
    `userID` CHAR(36) NULL,
    `name` VARCHAR(20) NOT NULL,
    `color` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dashboards` (
    `ID` CHAR(36) NOT NULL,
    `dateFrom` DATE NOT NULL,
    `dateTo` DATE NOT NULL,
    `initialAmount` DECIMAL(6, 2) NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `initialCeiling` DECIMAL(6, 2) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recurrings` (
    `ID` CHAR(36) NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `dateFrom` DATE NOT NULL,
    `dateTo` DATE NOT NULL,
    `itemType` VARCHAR(11) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(6, 2) NOT NULL,
    `currency` VARCHAR(3) NULL,
    `invoicefile` VARCHAR(255) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Spendings` (
    `ID` CHAR(36) NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `itemType` VARCHAR(11) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(6, 2) NOT NULL,
    `categoryID` CHAR(36) NULL,
    `currency` VARCHAR(3) NULL,
    `invoicefile` VARCHAR(255) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `ID` CHAR(36) NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `password` VARCHAR(60) NOT NULL,
    `email` VARCHAR(250) NOT NULL,
    `registerDate` DATETIME(0) NULL,
    `language` VARCHAR(3) NULL DEFAULT 'en',
    `baseCurrency` VARCHAR(3) NOT NULL,

    UNIQUE INDEX `Users_email_key`(`email`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Spendings` ADD CONSTRAINT `Spendings_categoryID_fkey` FOREIGN KEY (`categoryID`) REFERENCES `Categories`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

