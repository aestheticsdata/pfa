import { textKey } from "@contexts/price-comparison/domain/text-key";

/**
 * A store's or a product type's name as kept (PFA-275): trimmed to its column, with the key it is
 * recognised by — upper-cased, accents and punctuation dropped. Two spellings, one key, one entry.
 */
export class CatalogName {
  private constructor(
    readonly text: string,
    readonly key: string,
  ) {}

  static of(raw: string, maxLength: number): CatalogName {
    const text = raw.trim().slice(0, maxLength);
    return new CatalogName(text, textKey(text));
  }

  /** Nothing left once punctuation is dropped: " .. " names nothing. */
  isBlank(): boolean {
    return this.key === "";
  }
}
