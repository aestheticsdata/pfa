-- Both ends of the foreign key are new columns: their collation is pinned so the
-- pair matches whatever the tables default to on each database (PFA-218).

-- AlterTable
ALTER TABLE `ReceiptLines` ADD COLUMN `productTypeID` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    ADD COLUMN `quantity` DECIMAL(8, 3) NOT NULL DEFAULT 1,
    ADD COLUMN `size` DECIMAL(8, 3) NULL,
    ADD COLUMN `sizeUnit` VARCHAR(2) NULL;

-- CreateTable
CREATE TABLE `ProductTypes` (
    `ID` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `nameKey` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `ProductTypes_userID_nameKey_key`(`userID`, `nameKey`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ReceiptLines_productTypeID_fkey` ON `ReceiptLines`(`productTypeID`);

-- AddForeignKey
ALTER TABLE `ReceiptLines` ADD CONSTRAINT `ReceiptLines_productTypeID_fkey` FOREIGN KEY (`productTypeID`) REFERENCES `ProductTypes`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

