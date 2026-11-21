import { DbBackupCronService } from "@infrastructure/db-backup/db-backup-cron.service";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { Module } from "@nestjs/common";

@Module({
  imports: [SshBackupModule],
  providers: [DbBackupCronService],
})
export class DbBackupModule {}
