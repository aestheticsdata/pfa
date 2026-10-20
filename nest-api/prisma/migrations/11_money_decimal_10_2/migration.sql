-- Money columns widened from DECIMAL(6,2) (max 9,999.99) to DECIMAL(10,2), like Exceptionals.amount (PFA-259).
-- AlterTable
ALTER TABLE `Dashboards` MODIFY `initialAmount` DECIMAL(10, 2) NOT NULL,
    MODIFY `initialCeiling` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `ReceiptLines` MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Recurrings` MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Spendings` MODIFY `amount` DECIMAL(10, 2) NOT NULL;

