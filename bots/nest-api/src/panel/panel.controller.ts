import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Actor } from "#app/auth/actor.decorator.js";
import { CsrfGuard } from "#app/auth/guards/csrf.guard.js";
import { SessionAuthGuard } from "#app/auth/guards/session-auth.guard.js";
import {
  botsQuerySchema,
  bulkSchema,
  closeAccountSchema,
  enabledSchema,
  loadPaceSchema,
  quietHoursSchema,
  rampSchema,
  targetSchema,
} from "#app/panel/panel.schemas.js";
import { PanelService } from "#app/panel/panel.service.js";
import { CONTROL_ACTION } from "#app/panel/panel-actions.js";

import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type {
  ActionsView,
  AppSummary,
  BotDetailView,
  BotsPage,
  IncidentsView,
  MetricsView,
  OverviewView,
  PanelHeader,
} from "#app/contracts/interfaces/panelTypes.js";
import type {
  ActionRoute,
  BotRoute,
  BulkBody,
  CloseAccountBody,
  EnabledBody,
  LoadPaceBody,
  TargetBody,
} from "#app/panel/interfaces/panelBodyTypes.js";
import type { BotsQuery } from "#app/panel/interfaces/panelViewTypes.js";
import type { RunnerQuietHoursInput, RunnerRamp } from "#app/runner/interfaces/runnerApiTypes.js";

/**
 * The panel's API, one app at a time (`/apps/:app/…`). Signed-in only; every unsafe verb also needs
 * the session's CSRF token. Reads are live from the runner; changes are audited.
 */
@Controller("apps")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class PanelController {
  constructor(private readonly panel: PanelService) {}

  @Get()
  apps(): Promise<AppSummary[]> {
    return this.panel.summaries();
  }

  @Get(":app/header")
  header(@Param("app") app: string): Promise<PanelHeader> {
    return this.panel.header(app);
  }

  @Get(":app/overview")
  overview(@Param("app") app: string): Promise<OverviewView> {
    return this.panel.overview(app);
  }

  @Get(":app/bots")
  bots(@Param("app") app: string, @Query({ schema: botsQuerySchema }) query: BotsQuery): Promise<BotsPage> {
    return this.panel.bots(app, query);
  }

  @Get(":app/bots/:bot")
  bot(@Param("app") app: string, @Param("bot") bot: string): Promise<BotDetailView> {
    return this.panel.bot(app, bot);
  }

  @Get(":app/metrics")
  metrics(@Param("app") app: string): Promise<MetricsView> {
    return this.panel.metrics(app);
  }

  @Get(":app/actions")
  actions(@Param("app") app: string): Promise<ActionsView> {
    return this.panel.actions(app);
  }

  @Get(":app/incidents")
  incidents(@Param("app") app: string): Promise<IncidentsView> {
    return this.panel.incidentsView(app);
  }

  /** The "Daily bots" switch: the permanent bots; load bots untouched. */
  @Put(":app/daily")
  setDaily(
    @Param("app") app: string,
    @Body({ schema: enabledSchema }) body: EnabledBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.dailySet, enabled: body.enabled } });
  }

  @Put(":app/target")
  setTarget(
    @Param("app") app: string,
    @Body({ schema: targetSchema }) body: TargetBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.targetSet, target: body.target } });
  }

  @Put(":app/ramp")
  setRamp(
    @Param("app") app: string,
    @Body({ schema: rampSchema }) ramp: RunnerRamp,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.rampSet, ramp } });
  }

  /** The "Load bots" switch: off stops every load bot and keeps the target; daily bots untouched. */
  @Put(":app/load")
  setLoad(
    @Param("app") app: string,
    @Body({ schema: enabledSchema }) body: EnabledBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.loadSet, enabled: body.enabled } });
  }

  @Put(":app/load-pace")
  setLoadPace(
    @Param("app") app: string,
    @Body({ schema: loadPaceSchema }) body: LoadPaceBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.loadPaceSet, pace: body.pace } });
  }

  @Put(":app/quiet-hours")
  setQuietHours(
    @Param("app") app: string,
    @Body({ schema: quietHoursSchema }) hours: RunnerQuietHoursInput,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.quietHoursSet, hours } });
  }

  @Patch(":app/bots/:bot")
  setBot(
    @Param() route: BotRoute,
    @Body({ schema: enabledSchema }) body: EnabledBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    const toggle = { ids: [route.bot], enabled: body.enabled };
    return this.panel.control({ app: route.app, actor, action: { kind: CONTROL_ACTION.botsToggle, toggle } });
  }

  @Post(":app/bots-bulk")
  @HttpCode(HttpStatus.OK)
  setBots(
    @Param("app") app: string,
    @Body({ schema: bulkSchema }) toggle: BulkBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.botsToggle, toggle } });
  }

  @Post(":app/bots/:bot/restart-session")
  @HttpCode(HttpStatus.OK)
  restartSession(@Param("app") app: string, @Param("bot") bot: string, @Actor() actor: AuditActor): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.botRestartSession, botId: bot } });
  }

  @Patch(":app/actions/:action")
  setAction(
    @Param() route: ActionRoute,
    @Body({ schema: enabledSchema }) body: EnabledBody,
    @Actor() actor: AuditActor,
  ): Promise<unknown> {
    const action = { kind: CONTROL_ACTION.actionToggle, name: route.action, enabled: body.enabled } as const;
    return this.panel.control({ app: route.app, actor, action });
  }

  @Post(":app/actions-enable-all")
  @HttpCode(HttpStatus.OK)
  enableAllActions(@Param("app") app: string, @Actor() actor: AuditActor): Promise<unknown> {
    return this.panel.control({ app, actor, action: { kind: CONTROL_ACTION.actionsEnableAll } });
  }

  @Post(":app/incidents/:incident/ack")
  @HttpCode(HttpStatus.OK)
  async acknowledge(
    @Param("app") app: string,
    @Param("incident") incident: string,
    @Actor() actor: AuditActor,
  ): Promise<{ ok: true }> {
    await this.panel.acknowledge(app, incident, actor);
    return { ok: true };
  }

  /** Disable (default) or purge a bot's account in its app; closes its open incidents. */
  @Post(":app/bots/:bot/close-account")
  @HttpCode(HttpStatus.OK)
  async closeAccount(
    @Param() route: BotRoute,
    @Body({ schema: closeAccountSchema }) body: CloseAccountBody,
    @Actor() actor: AuditActor,
  ): Promise<{ ok: true }> {
    await this.panel.closeAccount({ app: route.app, botId: route.bot, purge: body.purge, actor });
    return { ok: true };
  }
}
