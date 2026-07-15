import { Dropzone, GlowCard, Overline } from "pfa-next";
import { Upload } from "lucide-react";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const noop = () => {};

/**
 * The receipt field of the spending modal: the compact row shape — icon tile on
 * the left, label + accepted types stacked next to it.
 */
export const ReceiptRow = () => (
  <Dropzone
    accept={IMAGE_TYPES}
    onFile={noop}
    className="w-[340px] items-center gap-3 rounded-md px-4 py-3.5"
  >
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-elec/10 text-elec">
      <Upload className="size-5" />
    </span>
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-semibold text-ink">
        Glisser un reçu ou <span className="text-elec underline underline-offset-2">parcourir</span>
      </span>
      <span className="num text-xs text-ink-4">jpg, png, webp</span>
    </span>
  </Dropzone>
);

/**
 * The invoice modal's upload zone: the tall centred column shape, the same
 * component with a different `className`.
 */
export const InvoiceColumn = () => (
  <Dropzone
    accept={IMAGE_TYPES}
    onFile={noop}
    className="w-[340px] flex-col items-center gap-1.5 rounded-xl px-5.5 py-7.5 text-center"
  >
    <Upload className="size-7.5 text-elec" />
    <span className="text-base font-semibold text-ink">Choisir une facture</span>
    <span className="num text-sm text-ink-4">jpg, png, webp — 5 Mo max</span>
  </Dropzone>
);

/** In context: the receipt zone on a card surface, under its section label. */
export const InCard = () => (
  <GlowCard
    as="section"
    className="w-[340px] p-5"
  >
    <Overline>Reçu</Overline>
    <Dropzone
      accept={IMAGE_TYPES}
      onFile={noop}
      className="mt-3 items-center gap-3 rounded-md px-4 py-3.5"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-elec/10 text-elec">
        <Upload className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">
          Glisser un reçu ou <span className="text-elec underline underline-offset-2">parcourir</span>
        </span>
        <span className="num text-xs text-ink-4">Uber — 41,35 € — 14 mai 2026</span>
      </span>
    </Dropzone>
  </GlowCard>
);
