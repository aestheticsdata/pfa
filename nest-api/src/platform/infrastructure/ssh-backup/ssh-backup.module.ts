import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
  providers: [SshBackupService],
  exports: [SshBackupService],
})
export class SshBackupModule {}
