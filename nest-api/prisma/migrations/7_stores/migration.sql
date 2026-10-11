-- Both ends of the foreign key are new columns: their collation is pinned so the
-- pair matches whatever the tables default to (prod keeps legacy collations —
-- the FK of 5_recurring_category failed on that). PFA-218.

-- AlterTable
ALTER TABLE `Spendings` ADD COLUMN `storeID` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- CreateTable
CREATE TABLE `Stores` (
    `ID` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `userID` CHAR(36) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `nameKey` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `Stores_userID_nameKey_key`(`userID`, `nameKey`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Spendings_storeID_fkey` ON `Spendings`(`storeID`);

-- AddForeignKey
ALTER TABLE `Spendings` ADD CONSTRAINT `Spendings_storeID_fkey` FOREIGN KEY (`storeID`) REFERENCES `Stores`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

