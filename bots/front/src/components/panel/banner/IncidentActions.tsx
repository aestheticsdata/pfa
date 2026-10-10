"use client";

import { useToastStore } from "@components/panel/shared/toastStore";
import Button from "@components/ui/Button";
import { BUTTON_VARIANT } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";
import { acknowledge } from "@lib/panel/panelActions";
import { closePath } from "@lib/panel/routes";
import { CLOSE_TEXT } from "@text/bots";
import { PANEL_TEXT } from "@text/panel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { IncidentActionsProps } from "@components/panel/banner/interfaces/bannerTypes";

/** Acknowledge, or open the "Disable / purge" modal for the bot the incident names. */
const IncidentActions = ({ app, incident, compact = false }: IncidentActionsProps) => {
  const router = useRouter();
  const show = useToastStore((state) => state.show);
  const [pending, start] = useTransition();
  const ack = () =>
    start(async () => {
      const result = await acknowledge(app, incident.id);
      show(result.ok ? CLOSE_TEXT.acknowledged : (result.message ?? PANEL_TEXT.boundary.failed));
      router.refresh();
    });
  const button = compact ? "justify-center" : undefined;
  return (
    <div className={cx("gap-2", compact ? "mt-2.25 grid grid-cols-2" : "flex")}>
      <Button
        variant={BUTTON_VARIANT.ghost}
        disabled={pending}
        onClick={ack}
        className={cx("border-bad/40 text-text", button)}
      >
        {PANEL_TEXT.banner.acknowledge}
      </Button>
      {incident.botId ? (
        <Link
          href={closePath({ app, bot: incident.botId, incident: incident.id })}
          scroll={false}
          className={cx(
            "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-ctl border border-bad bg-bad px-3 text-body font-semibold text-on-bad no-underline hover:brightness-106 tablet:h-8",
            button,
          )}
        >
          {PANEL_TEXT.banner.disable}
        </Link>
      ) : (
        <Button
          variant={BUTTON_VARIANT.danger}
          disabled
          className={button}
        >
          {PANEL_TEXT.banner.disable}
        </Button>
      )}
    </div>
  );
};

export default IncidentActions;
