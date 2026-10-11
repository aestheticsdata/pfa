import { Injectable, NotFoundException } from "@nestjs/common";
import { AppsService } from "#app/apps/apps.service.js";
import { AuditService } from "#app/audit/audit.service.js";
import { BOT_KIND, BOTS_PAGE_SIZE, INCIDENT_STATUS, POPULATION } from "#app/contracts/panel.js";
import { IncidentsService } from "#app/incidents/incidents.service.js";
import { CONTROL_ACTION } from "#app/panel/panel-actions.js";
import {
  actionViews,
  activityHistogram,
  activityPoints,
  botView,
  isLiveState,
  statusView,
} from "#app/panel/panel-view.js";
import { AuditStatus, IncidentStatus } from "#prisma-client/enums.js";

import type { AppEntry } from "#app/apps/interfaces/appTypes.js";
import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type {
  ActionsView,
  AppSummary,
  BotDetailView,
  BotsPage,
  IncidentRow,
  IncidentsView,
  IncidentView,
  MetricsView,
  OverviewView,
  PanelHeader,
} from "#app/contracts/interfaces/panelTypes.js";
import type { AccountClosure, ControlAction, PanelChange } from "#app/panel/interfaces/panelActionTypes.js";
import type { BotsQuery } from "#app/panel/interfaces/panelViewTypes.js";
import type { RunnerBot } from "#app/runner/interfaces/runnerApiTypes.js";

const ACCOUNT_AUDIT = { disable: "account.disable", purge: "account.purge" } as const;
const INCIDENT_AUDIT = { acknowledge: "incident.acknowledge" } as const;

/**
 * The back-office's pages, built from the app's runner (live data, never stored) and the incident
 * log. Every change goes through `control`, which audits it — who, from where, what, and whether
 * the runner took it.
 */
@Injectable()
export class PanelService {
  constructor(
    private readonly apps: AppsService,
    private readonly incidents: IncidentsService,
    private readonly audit: AuditService,
  ) {}

  /** The picker: one line per app. An unreachable runner is shown as such, not as an error page. */
  async summaries(): Promise<AppSummary[]> {
    return Promise.all(this.apps.list().map((app) => this.summary(app)));
  }

  async header(appId: string): Promise<PanelHeader> {
    const app = this.apps.get(appId);
    // An unreachable runner still gives a header (and the banner): the pages below say what failed.
    const [apps, bots, actions, open] = await Promise.all([
      this.summaries(),
      app.runner.bots().catch(() => []),
      app.runner.actions().catch(() => []),
      this.openIncidents(app),
    ]);
    const summary = apps.find((entry) => entry.id === app.id) ?? (await this.summary(app));
    return {
      app: summary,
      apps,
      botCount: bots.length,
      actionsOn: actions.filter((action) => action.enabled).length,
      actionsTotal: actions.length,
      refreshedAt: new Date().toISOString(),
      incidents: open,
    };
  }

  async overview(appId: string): Promise<OverviewView> {
    const app = this.apps.get(appId);
    const [status, history, bots, flagged] = await Promise.all([
      app.runner.status(),
      app.runner.history(),
      app.runner.bots(),
      this.flaggedAccounts(app.id),
    ]);
    return {
      status: statusView(status),
      history: activityPoints(history),
      dailyBots: bots
        .filter((bot) => bot.kind === BOT_KIND.daily)
        .map((bot) => botView({ bot, incident: flagged.has(bot.email) })),
    };
  }

  async bots(appId: string, query: BotsQuery): Promise<BotsPage> {
    const app = this.apps.get(appId);
    const [status, bots, flagged] = await Promise.all([
      app.runner.status(),
      app.runner.bots(),
      this.flaggedAccounts(app.id),
    ]);
    const views = bots.map((bot) => botView({ bot, incident: flagged.has(bot.email) }));
    const population = { [POPULATION.all]: views.length } as Record<string, number>;
    for (const view of views) population[view.kind] = (population[view.kind] ?? 0) + 1;

    const inPopulation = views.filter((view) => query.population === POPULATION.all || view.kind === query.population);
    const state: Record<string, number> = {};
    for (const view of inPopulation) state[view.state] = (state[view.state] ?? 0) + 1;

    const needle = query.q.trim().toLowerCase();
    const matching = inPopulation.filter(
      (view) =>
        (query.state === "all" || view.state === query.state) &&
        (!needle || view.email.includes(needle) || view.id.includes(needle)),
    );
    const pages = Math.max(1, Math.ceil(matching.length / BOTS_PAGE_SIZE));
    const page = Math.min(Math.max(0, query.page), pages - 1);
    return {
      rows: matching.slice(page * BOTS_PAGE_SIZE, (page + 1) * BOTS_PAGE_SIZE),
      total: matching.length,
      page,
      pages,
      counts: { population, state },
      matchingIds: matching.map((view) => view.id),
      running: status.running,
    };
  }

  async bot(appId: string, botId: string): Promise<BotDetailView> {
    const app = this.apps.get(appId);
    const [bot, flagged] = await Promise.all([app.runner.bot(botId), this.flaggedAccounts(app.id)]);
    if (!bot) {
      throw new NotFoundException("Unknown bot", { errorCode: "BOT_UNKNOWN" });
    }
    return {
      ...botView({ bot, incident: flagged.has(bot.email) }),
      byAction: Object.entries(bot.byAction)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      recentRequests: bot.recentRequests,
    };
  }

  async metrics(appId: string): Promise<MetricsView> {
    const app = this.apps.get(appId);
    const [status, history, bots, actions] = await Promise.all([
      app.runner.status(),
      app.runner.history(),
      app.runner.bots(),
      app.runner.actions(),
    ]);
    const live = bots.map((bot) => botView({ bot, incident: false })).filter((view) => isLiveState(view.state));
    return {
      history: activityPoints(history),
      activity: activityHistogram(live),
      liveBots: live.length,
      actionMix: actionViews({
        actions,
        actionsPerMin: status.actionsPerMin,
        quietActive: status.quietHours.active,
      }),
      mixRuns: actions.map((action) => ({ name: action.name, count: action.runs })),
    };
  }

  async actions(appId: string): Promise<ActionsView> {
    const app = this.apps.get(appId);
    const [status, actions] = await Promise.all([app.runner.status(), app.runner.actions()]);
    return {
      actions: actionViews({ actions, actionsPerMin: status.actionsPerMin, quietActive: status.quietHours.active }),
      quietActive: status.quietHours.active,
    };
  }

  async incidentsView(appId: string): Promise<IncidentsView> {
    const app = this.apps.get(appId);
    const [rows, bots] = await Promise.all([this.incidents.list(app.id), this.botsOrNone(app)]);
    const withBots = rows.map((row) => attribute(row, bots));
    return {
      open: withBots.filter((row) => row.status === INCIDENT_STATUS.open),
      history: withBots.filter((row) => row.status !== INCIDENT_STATUS.open),
    };
  }

  /** Any change to the runner, audited whether it succeeds or not. */
  async control(change: PanelChange): Promise<unknown> {
    const app = this.apps.get(change.app);
    const entry = { actor: change.actor, action: change.action.kind, targetApp: app.id };
    try {
      const result = await this.apply(app, change.action);
      await this.audit.record({ ...entry, status: AuditStatus.ok, detail: JSON.stringify(change.action) });
      return result;
    } catch (error) {
      await this.audit.record({ ...entry, status: AuditStatus.failed, detail: String(error) });
      throw error;
    }
  }

  async acknowledge(appId: string, incidentId: string, actor: AuditActor): Promise<void> {
    const app = this.apps.get(appId);
    await this.incidents.acknowledge(app.id, incidentId);
    await this.audit.record({
      actor,
      action: INCIDENT_AUDIT.acknowledge,
      targetApp: app.id,
      target: incidentId,
      status: AuditStatus.ok,
    });
  }

  /**
   * "Disable / purge": the runner asks the app, then blocks the bot; the bot's open incidents are
   * closed with the outcome. Audited either way.
   */
  async closeAccount(closure: AccountClosure): Promise<void> {
    const app = this.apps.get(closure.app);
    const bot = await app.runner.bot(closure.botId);
    if (!bot) {
      throw new NotFoundException("Unknown bot", { errorCode: "BOT_UNKNOWN" });
    }
    const action = closure.purge ? ACCOUNT_AUDIT.purge : ACCOUNT_AUDIT.disable;
    try {
      await app.runner.closeAccount(bot.id, closure.purge);
    } catch (error) {
      await this.audit.record({
        actor: closure.actor,
        action,
        targetApp: app.id,
        target: bot.email,
        status: AuditStatus.failed,
        detail: String(error),
      });
      throw error;
    }
    await this.incidents.resolveAccount({
      app: app.id,
      account: bot.email,
      status: closure.purge ? IncidentStatus.purged : IncidentStatus.disabled,
    });
    await this.audit.record({
      actor: closure.actor,
      action,
      targetApp: app.id,
      target: bot.email,
      status: AuditStatus.ok,
    });
  }

  private async apply(app: AppEntry, action: ControlAction): Promise<unknown> {
    const { runner } = app;
    switch (action.kind) {
      case CONTROL_ACTION.dailySet:
        return { enabled: await runner.setDaily(action.enabled) };
      case CONTROL_ACTION.targetSet:
        return { target: await runner.setTarget(action.target) };
      case CONTROL_ACTION.rampSet:
        return runner.setRamp(action.ramp);
      case CONTROL_ACTION.loadSet:
        return { enabled: await runner.setLoad(action.enabled) };
      case CONTROL_ACTION.loadPaceSet:
        return { pace: await runner.setLoadPace(action.pace) };
      case CONTROL_ACTION.quietHoursSet:
        return runner.setQuietHours(action.hours);
      case CONTROL_ACTION.botsToggle:
        return runner.setBots(action.toggle);
      case CONTROL_ACTION.botRestartSession:
        if (!(await runner.restartSession(action.botId))) {
          throw new NotFoundException("Unknown bot", { errorCode: "BOT_UNKNOWN" });
        }
        return { restarted: true };
      case CONTROL_ACTION.actionToggle:
        if (!(await runner.setAction(action.name, action.enabled))) {
          throw new NotFoundException("Unknown action", { errorCode: "ACTION_UNKNOWN" });
        }
        return { enabled: action.enabled };
      case CONTROL_ACTION.actionsEnableAll:
        return runner.enableAllActions();
    }
  }

  private async summary(app: AppEntry): Promise<AppSummary> {
    const openIncidents = await this.incidents.openCount(app.id);
    const base = {
      id: app.id,
      name: app.name,
      host: app.host,
      address: app.address,
      theme: app.theme,
      timeZone: app.timeZone,
      allowedIps: app.allowedIps,
      openIncidents,
    };
    try {
      const status = await app.runner.status();
      return {
        ...base,
        running: status.running,
        liveBots: status.liveDaily + status.liveLoad,
        configured: status.totalDaily + status.totalLoad > 0,
        reachable: true,
      };
    } catch {
      return { ...base, running: false, liveBots: 0, configured: false, reachable: false };
    }
  }

  private async openIncidents(app: AppEntry): Promise<IncidentRow[]> {
    const view = await this.incidentsView(app.id);
    return view.open;
  }

  /** Emails with an open incident: their rows get the red "incident" tag. */
  private async flaggedAccounts(appId: string): Promise<Set<string>> {
    const rows = await this.incidents.list(appId);
    return new Set(rows.filter((row) => row.status === INCIDENT_STATUS.open).map((row) => row.account));
  }

  private async botsOrNone(app: AppEntry): Promise<RunnerBot[]> {
    try {
      return await app.runner.bots();
    } catch {
      return [];
    }
  }
}

function attribute(row: IncidentView, bots: RunnerBot[]): IncidentRow {
  const bot = bots.find((candidate) => candidate.email === row.account);
  return { ...row, botId: bot?.id ?? null, kind: bot?.kind ?? null };
}
