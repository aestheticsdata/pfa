-- DropIndex
DROP INDEX `Stores_userID_nameKey_key` ON `Stores`;

-- AlterTable
ALTER TABLE `Stores` ADD COLUMN `address` VARCHAR(120) NULL,
    ADD COLUMN `addressKey` VARCHAR(120) NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX `Stores_userID_nameKey_addressKey_key` ON `Stores`(`userID`, `nameKey`, `addressKey`);

