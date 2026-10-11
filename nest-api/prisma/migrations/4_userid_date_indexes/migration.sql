-- CreateIndex
CREATE INDEX `Categories_userID_idx` ON `Categories`(`userID`);

-- CreateIndex
CREATE INDEX `Dashboards_userID_dateFrom_idx` ON `Dashboards`(`userID`, `dateFrom`);

-- CreateIndex
CREATE INDEX `Exceptionals_userID_date_idx` ON `Exceptionals`(`userID`, `date`);

-- CreateIndex
CREATE INDEX `Recurrings_userID_dateFrom_idx` ON `Recurrings`(`userID`, `dateFrom`);

-- CreateIndex
CREATE INDEX `SpendingGroups_userID_idx` ON `SpendingGroups`(`userID`);

-- CreateIndex
CREATE INDEX `Spendings_userID_date_idx` ON `Spendings`(`userID`, `date`);

