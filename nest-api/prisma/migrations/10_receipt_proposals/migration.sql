-- The foreign key points at `Spendings`.`ID`, whose collation differs between
-- databases (legacy utf8mb4_bin on prod, utf8mb4_unicode_ci elsewhere): the new
-- column takes whatever that column uses, so one migration fits both (PFA-223).
SET @spending_id_collation = (
    SELECT `COLLATION_NAME` FROM `information_schema`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'Spendings' AND `COLUMN_NAME` = 'ID'
);

-- CreateTable
SET @create_receipt_proposals = CONCAT(
    'CREATE TABLE `ReceiptProposals` (',
    '`ID` CHAR(36) NOT NULL,',
    '`spendingID` CHAR(36) CHARACTER SET utf8mb4 COLLATE ', @spending_id_collation, ' NOT NULL,',
    '`userID` CHAR(36) NOT NULL,',
    '`status` VARCHAR(7) NOT NULL,',
    '`proposal` JSON NULL,',
    '`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),',
    'UNIQUE INDEX `ReceiptProposals_spendingID_key`(`spendingID`),',
    'INDEX `ReceiptProposals_userID_status_idx`(`userID`, `status`),',
    'PRIMARY KEY (`ID`)',
    ') DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
);
PREPARE create_receipt_proposals FROM @create_receipt_proposals;
EXECUTE create_receipt_proposals;
DEALLOCATE PREPARE create_receipt_proposals;

-- AddForeignKey
ALTER TABLE `ReceiptProposals` ADD CONSTRAINT `ReceiptProposals_spendingID_fkey` FOREIGN KEY (`spendingID`) REFERENCES `Spendings`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;
