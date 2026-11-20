const MONTHS_PER_YEAR = 12;

/**
 * A calendar month (PFA-272), `month` 0-based like `Date`. All arithmetic is in UTC so a month's
 * bounds never shift with the server's time zone.
 */
export class CalendarMonth {
  private constructor(
    readonly year: number,
    readonly month: number,
  ) {}

  static of(year: number, month: number): CalendarMonth {
    const index = year * MONTHS_PER_YEAR + month;
    return new CalendarMonth(
      Math.floor(index / MONTHS_PER_YEAR),
      ((index % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR,
    );
  }

  /** The month a date falls in, read in UTC. */
  static containing(date: Date): CalendarMonth {
    return new CalendarMonth(date.getUTCFullYear(), date.getUTCMonth());
  }

  plusMonths(count: number): CalendarMonth {
    return CalendarMonth.of(this.year, this.month + count);
  }

  plusYears(count: number): CalendarMonth {
    return CalendarMonth.of(this.year + count, this.month);
  }

  /** First instant of the month. */
  start(): Date {
    return new Date(Date.UTC(this.year, this.month, 1));
  }

  /** First instant of the next month: the exclusive end of a half-open range. */
  end(): Date {
    return new Date(Date.UTC(this.year, this.month + 1, 1));
  }

  daysIn(): number {
    // Day 0 of the next month is the last day of this one.
    return new Date(Date.UTC(this.year, this.month + 1, 0)).getUTCDate();
  }

  /** "2026-11-01". */
  firstDayIso(): string {
    return this.start().toISOString().slice(0, 10);
  }
}
