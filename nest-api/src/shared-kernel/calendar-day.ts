import { InvalidInputError } from "@shared-kernel/domain-error";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A day on the calendar, with no time and no time zone (PFA-272). MySQL `@db.Date` columns come
 * back as UTC midnights; the day is read from the UTC fields, never from the server's local time.
 */
export class CalendarDay {
  private constructor(readonly iso: string) {}

  /** "2026-11-20", or any ISO timestamp — only its date part counts. */
  static of(value: string): CalendarDay {
    const iso = value.slice(0, 10);
    if (!ISO_DAY.test(iso) || Number.isNaN(Date.parse(`${iso}T00:00:00.000Z`))) {
      throw new InvalidInputError(`Invalid date: ${value}`);
    }
    return new CalendarDay(iso);
  }

  /** A `@db.Date` value as Prisma returns it. */
  static fromDate(date: Date): CalendarDay {
    return new CalendarDay(date.toISOString().slice(0, 10));
  }

  equals(other: CalendarDay): boolean {
    return this.iso === other.iso;
  }

  /** The UTC midnight Prisma writes to a `@db.Date` column. */
  toDate(): Date {
    return new Date(`${this.iso}T00:00:00.000Z`);
  }
}
