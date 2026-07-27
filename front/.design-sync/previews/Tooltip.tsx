import { IconButton, MoneyAmount, Tooltip } from "pfa-next";
import { Info } from "lucide-react";

/**
 * The canonical story: the info affordance next to a computed stat. `mode="anchor"`
 * pins the bubble to its trigger and keeps Radix's keyboard/focus/Escape behaviour;
 * `defaultOpen` pins the portalled content open for the capture.
 */
export const Default = () => (
  // `pt-12` buys the `side="top"` content its clearance: without it the tooltip
  // collides with the viewport edge and Radix flips it under the row.
  <div className="flex items-center gap-2 pt-12">
    <span className="text-2xs tracking-caps text-ink-4">RESTE À VIVRE</span>
    <Tooltip
      mode="anchor"
      side="top"
      defaultOpen
      content="Revenus moins les dépenses fixes du mois."
    >
      <IconButton
        variant="ghost"
        size={5}
        aria-label="Comment est calculé le reste à vivre ?"
      >
        <Info />
      </IconButton>
    </Tooltip>
    <MoneyAmount value={780} />
  </div>
);

/**
 * The anchored mode's variant axis: `side` — where the bubble sits around its trigger.
 *
 * `avoidCollisions={false}` is load-bearing: the capture viewport is 620x300, so
 * Radix's collision detection otherwise flips every side back toward the middle
 * (top→bottom, left→right) and all four cells render identically. Each trigger is
 * parked so its true side has room — the `left`/`right` pair hug the centre gutter
 * and point inward, so nothing overflows the card.
 */
export const Sides = () => (
  <div className="grid grid-cols-2 items-center gap-x-8 gap-y-16 px-6 py-12">
    {(
      [
        { side: "top", justify: "justify-center" },
        { side: "bottom", justify: "justify-center" },
        { side: "left", justify: "justify-end" },
        { side: "right", justify: "justify-start" },
      ] as const
    ).map(({ side, justify }) => (
      <div
        key={side}
        className={`flex ${justify}`}
      >
        <Tooltip
          mode="anchor"
          side={side}
          sideOffset={6}
          avoidCollisions={false}
          defaultOpen
          content="Plafond hebdomadaire"
        >
          <IconButton
            variant="bordered"
            size={7}
            aria-label={`Aide — ${side}`}
          >
            <Info />
          </IconButton>
        </Tooltip>
      </div>
    ))}
  </div>
);

/**
 * A longer explanation — the bubble is `w-fit` and caps at 240px, so a full
 * sentence wraps evenly instead of running off. `maxWidth` widens that cap.
 */
export const LongContent = () => (
  <div className="flex items-center gap-2">
    <span className="text-2xs tracking-caps text-ink-4">PROJECTION</span>
    <Tooltip
      mode="anchor"
      side="bottom"
      defaultOpen
      maxWidth={256}
      content="Projection basée sur mai 2025. À défaut, le même mois de l'année précédente, puis le mois précédent."
    >
      <IconButton
        variant="ghost"
        size={5}
        aria-label="D'où vient cette projection ?"
      >
        <Info />
      </IconButton>
    </Tooltip>
    <MoneyAmount value={1240.5} />
  </div>
);
