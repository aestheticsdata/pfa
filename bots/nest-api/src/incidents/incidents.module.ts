import { Module } from "@nestjs/common";
import { AlertLogWatcherService } from "#app/incidents/alert-log-watcher.service.js";
import { IncidentsService } from "#app/incidents/incidents.service.js";
import { MockIncidentsSeeder } from "#app/mock/mock-incidents.seeder.js";
import { PushModule } from "#app/push/push.module.js";

@Module({
  imports: [PushModule],
  providers: [IncidentsService, AlertLogWatcherService, MockIncidentsSeeder],
  exports: [IncidentsService],
})
export class IncidentsModule {}
