import {
  FieldShell,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "pfa-next";

const FIELD = "w-64";

/**
 * The currency select of the profile / signup form — the app's only Select.
 * Open, so the popper content, the grouped items and the check indicator on the
 * current value are all visible.
 */
export const Open = () => (
  <FieldShell
    label="Devise"
    htmlFor="sel-currency"
    className={FIELD}
  >
    <Select
      defaultValue="EUR"
      defaultOpen
    >
      <SelectTrigger
        id="sel-currency"
        className="w-full"
      >
        <SelectValue placeholder="Devise" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectGroup>
          <SelectLabel>Zone euro</SelectLabel>
          <SelectItem value="EUR">Euro : €</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Autres devises</SelectLabel>
          <SelectItem value="CHF">Franc suisse : CHF</SelectItem>
          <SelectItem value="GBP">Livre sterling : £</SelectItem>
          <SelectItem value="USD">Dollar américain : $</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </FieldShell>
);

/** The trigger's variant axis: `size="default"` (h-9) vs `size="sm"` (h-8). */
export const Sizes = () => (
  <div className={`flex flex-col gap-4 ${FIELD}`}>
    <FieldShell
      label="Devise — default"
      htmlFor="sel-size-default"
    >
      <Select defaultValue="EUR">
        <SelectTrigger
          id="sel-size-default"
          className="w-full"
        >
          <SelectValue placeholder="Devise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">Euro : €</SelectItem>
          <SelectItem value="CHF">Franc suisse : CHF</SelectItem>
        </SelectContent>
      </Select>
    </FieldShell>
    <FieldShell
      label="Devise — sm"
      htmlFor="sel-size-sm"
    >
      <Select defaultValue="EUR">
        <SelectTrigger
          id="sel-size-sm"
          size="sm"
          className="w-full"
        >
          <SelectValue placeholder="Devise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">Euro : €</SelectItem>
          <SelectItem value="CHF">Franc suisse : CHF</SelectItem>
        </SelectContent>
      </Select>
    </FieldShell>
  </div>
);

/** Nothing picked yet — `SelectValue`'s placeholder takes the muted tone. */
export const Placeholder = () => (
  <FieldShell
    label="Devise"
    htmlFor="sel-placeholder"
    className={FIELD}
  >
    <Select>
      <SelectTrigger
        id="sel-placeholder"
        className="w-full"
      >
        <SelectValue placeholder="Devise" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="EUR">Euro : €</SelectItem>
        <SelectItem value="CHF">Franc suisse : CHF</SelectItem>
      </SelectContent>
    </Select>
  </FieldShell>
);

/** Locked field — the devise can't be changed once des dépenses existent. */
export const Disabled = () => (
  <FieldShell
    label="Devise"
    htmlFor="sel-disabled"
    className={FIELD}
  >
    <Select
      defaultValue="EUR"
      disabled
    >
      <SelectTrigger
        id="sel-disabled"
        className="w-full"
      >
        <SelectValue placeholder="Devise" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="EUR">Euro : €</SelectItem>
      </SelectContent>
    </Select>
  </FieldShell>
);
