import { Module } from "@nestjs/common";
import { IncidentsModule } from "#app/incidents/incidents.module.js";
import { PanelController } from "#app/panel/panel.controller.js";
import { PanelService } from "#app/panel/panel.service.js";

@Module({ imports: [IncidentsModule], controllers: [PanelController], providers: [PanelService] })
export class PanelModule {}
