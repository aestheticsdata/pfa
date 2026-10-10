-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `singleton` BOOLEAN NOT NULL DEFAULT true,
    `email` VARCHAR(250) NOT NULL,
    `passwordHash` VARCHAR(60) NOT NULL,
    `recoveryPassphraseHash` VARCHAR(60) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_singleton_key`(`singleton`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditEntry` (
    `id` CHAR(36) NOT NULL,
    `actor` VARCHAR(250) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `targetApp` VARCHAR(64) NULL,
    `target` VARCHAR(250) NULL,
    `status` ENUM('ok', 'failed') NOT NULL,
    `detail` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditEntry_createdAt_idx`(`createdAt`),
    INDEX `AuditEntry_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incident` (
    `id` CHAR(36) NOT NULL,
    `app` VARCHAR(64) NOT NULL,
    `account` VARCHAR(250) NOT NULL,
    `userId` VARCHAR(64) NULL,
    `ip` VARCHAR(45) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `path` VARCHAR(255) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 1,
    `firstSeenAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL,
    `status` ENUM('open', 'acknowledged', 'disabled', 'purged') NOT NULL DEFAULT 'open',
    `pushedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Incident_app_status_idx`(`app`, `status`),
    INDEX `Incident_app_account_ip_idx`(`app`, `account`, `ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushSubscription` (
    `id` CHAR(36) NOT NULL,
    `endpoint` VARCHAR(500) NOT NULL,
    `p256dh` VARCHAR(200) NOT NULL,
    `auth` VARCHAR(100) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PushSubscription_endpoint_key`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogCursor` (
    `file` VARCHAR(500) NOT NULL,
    `inode` VARCHAR(32) NOT NULL,
    `offset` BIGINT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`file`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
