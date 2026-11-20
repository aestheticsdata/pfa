import type { DOMAIN_ERROR_KIND } from "@shared-kernel/domain-error";

/** How a broken business rule reads from outside the domain (PFA-272). */
export type DomainErrorKind = (typeof DOMAIN_ERROR_KIND)[keyof typeof DOMAIN_ERROR_KIND];

/** Something that happened in the domain, named in the past tense (PFA-272). */
export interface DomainEvent {
  readonly name: string;
  readonly ownerId: string;
}
