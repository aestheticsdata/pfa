import { Module } from "@nestjs/common";
import { SshBackupModule } from "@infrastructure/ssh-backup/ssh-backup.module";
import { DbBackupCronService } from "@infrastructure/db-backup/db-backup-cron.service";

@Module({
  imports: [SshBackupModule],
  providers: [DbBackupCronService],
})
export class DbBackupModule {}
