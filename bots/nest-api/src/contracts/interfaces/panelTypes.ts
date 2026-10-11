/**
 * What the back-office API serves its front, panel half. No imports (see `authTypes.ts`): the
 * string fields named after a constant hold one of that constant's values (`contracts/panel.ts`).
 */

/** One app in the picker and the switcher. */
export interface AppSummary {
  id: string;
  name: string;
  host: string;
  /** The runner's control address (`127.0.0.1:7300`). */
  address: string;
  /** Theme class suffix (`pfa` → `.theme-pfa`); null = the bot-runner identity. */
  theme: string | null;
  timeZone: string;
  /** The app's `SYNTHETIC_ALLOWED_IPS`, for the footer; null = not given. */
  allowedIps: string | null;
  running: boolean;
  liveBots: number;
  openIncidents: number;
  /** Has bots at all: an app without any shows "No bots configured…". */
  configured: boolean;
  /** Its runner answered. */
  reachable: boolean;
}

/** The top bar and the nav counts, on every page of an app. */
export interface PanelHeader {
  app: AppSummary;
  apps: AppSummary[];
  botCount: number;
  actionsOn: number;
  actionsTotal: number;
  refreshedAt: string;
  /** Open incidents, for the banner shown on every page. */
  incidents: IncidentRow[];
}

export interface SparkPoint {
  actions: number;
  errors: number;
}

export interface BotView {
  id: string;
  email: string;
  /** `BOT_KIND`. */
  kind: string;
  /** `BOT_VIEW_STATE`. */
  state: string;
  enabled: boolean;
  currentAction: string | null;
  actionsPerMin: number;
  /** Percent of attempts that failed. */
  errorRate: number;
  total: number;
  uploads: number;
  lastSeenAt: string | null;
  sessionStartedAt: string | null;
  /** The last 30 s, 15 slices of 2 s, oldest first. */
  spark: SparkPoint[];
  /** An open incident names this bot. */
  incident: boolean;
}

export interface ActionCount {
  name: string;
  count: number;
}

export interface RequestView {
  at: string;
  method: string;
  path: string;
  status: number;
  ms: number;
}

/** The drawer. */
export interface BotDetailView extends BotView {
  byAction: ActionCount[];
  recentRequests: RequestView[];
}

/** 1-second slice of the last 80 s (80 of them). */
export interface ActivityPoint {
  at: string;
  actions: number;
  errors: number;
  requests: number;
  p50: number;
  p95: number;
  codes2xx: number;
  codes4xx: number;
  codes5xx: number;
  live: number;
  target: number;
  throttled: boolean;
}

export interface QuietHoursView {
  /** `HH:MM` on the app's clock. */
  from: string;
  to: string;
  tz: string;
  active: boolean;
  nextChangeAt: string;
}

export interface LimitsView {
  maxBots: number;
  maxRps: number;
  uploadBudgetMB: number;
  windowDays: number;
}

export interface UploadBudgetView {
  usedMB: number;
  budgetMB: number;
  remainingMB: number;
  weekUploads: number;
  weekMB: number;
  /** At this week's pace; null when nothing was uploaded this week. */
  emptyInDays: number | null;
}

export interface RampView {
  step: number;
  everySec: number;
}

export interface StatusView {
  /** Either switch is on: the daily bots, the load bots, or both. */
  running: boolean;
  /** The "Daily bots" switch: off = every daily bot stopped. */
  dailyEnabled: boolean;
  liveDaily: number;
  totalDaily: number;
  liveLoad: number;
  target: number;
  spawned: number;
  ramp: RampView;
  /** The "Load bots" switch: off = every load bot stopped, the target kept. */
  loadEnabled: boolean;
  /** `LOAD_PACE.daily` or `LOAD_PACE.burst`. */
  loadPace: string;
  /** Visits in progress, and the most the runner runs at once. */
  activeVisits: number;
  maxActiveVisits: number;
  /** Seconds until the next ramp step; null when at target (or no ramp). */
  nextStepInSec: number | null;
  actionsPerMin: number;
  rps: number;
  throttled: boolean;
  /** Percent, over the last minute. */
  errorRate: number;
  errorsPerMin: number;
  quietHours: QuietHoursView;
  limits: LimitsView;
  uploadBudget: UploadBudgetView;
}

export interface OverviewView {
  status: StatusView;
  history: ActivityPoint[];
  dailyBots: BotView[];
}

export interface BotCounts {
  /** Per `POPULATION`. */
  population: Record<string, number>;
  /** Per `BOT_VIEW_STATE`, within the chosen population. */
  state: Record<string, number>;
}

export interface BotsPage {
  rows: BotView[];
  /** Rows matching the filters, all pages. */
  total: number;
  page: number;
  pages: number;
  counts: BotCounts;
  /** Every id matching the filters: "select all" selects across pages. */
  matchingIds: string[];
  running: boolean;
}

export interface ActionView {
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  /** Paused during quiet hours (it creates spendings). */
  quiet: boolean;
  /** Spends the upload budget. */
  budget: boolean;
  /** Its share of the current actions/min; null while it can't run (off, or quiet hours). */
  perMin: number | null;
  /** Percent of its runs that failed. */
  errorRate: number;
}

export interface ActionsView {
  actions: ActionView[];
  quietActive: boolean;
}

export interface HistogramBucket {
  label: string;
  count: number;
}

export interface MetricsView {
  history: ActivityPoint[];
  activity: HistogramBucket[];
  liveBots: number;
  actionMix: ActionView[];
  mixRuns: ActionCount[];
}

export interface IncidentView {
  id: string;
  /** The bot's email, or `user:<id>` when the alert named no email. */
  account: string;
  userId: string | null;
  ip: string;
  userAgent: string | null;
  path: string | null;
  attempts: number;
  firstSeenAt: string;
  lastSeenAt: string;
  /** `INCIDENT_STATUS`. */
  status: string;
  pushed: boolean;
}

/** An incident with the bot it names, when the runner knows it. */
export interface IncidentRow extends IncidentView {
  botId: string | null;
  /** `BOT_KIND`, or null for an account the runner doesn't know. */
  kind: string | null;
}

export interface IncidentsView {
  open: IncidentRow[];
  history: IncidentRow[];
}

export interface PushState {
  /** VAPID configured on the server. */
  available: boolean;
  publicKey: string | null;
  /** Devices subscribed. */
  devices: number;
}
