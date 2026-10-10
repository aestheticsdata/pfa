/**
 * A daily window, as 24 h `HH:MM` on the app's clock, during which the actions that opt in
 * (`pausedInQuietHours`) don't run. May cross midnight: `{ from: "22:00", to: "10:00" }`.
 */
export interface QuietHours {
  from: string;
  to: string;
}

/** The quiet window as the control API reports it (PFA-127 handoff v3: `GET quiet-hours`). */
export interface QuietHoursSnapshot extends QuietHours {
  /** The app's IANA zone; `from`/`to` are read in it. The back-office may display them in UTC. */
  tz: string;
  /** Whether the window is in force right now. */
  active: boolean;
  /** When `active` next flips (ISO 8601). */
  nextChangeAt: string;
}
