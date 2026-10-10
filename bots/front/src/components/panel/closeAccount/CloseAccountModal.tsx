"use client";

import useScrollLock from "@components/hooks/useScrollLock";
import ClosureOption from "@components/panel/closeAccount/ClosureOption";
import { useToastStore } from "@components/panel/shared/toastStore";
import Button from "@components/ui/Button";
import { BUTTON_VARIANT } from "@components/ui/variants";
import { ACCOUNT_CLOSURE, BOT_KIND } from "@contracts/panel";
import { closeAccount } from "@lib/panel/panelActions";
import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { CLOSE_TEXT } from "@text/bots";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { CloseAccountModalProps } from "@components/panel/closeAccount/interfaces/closeTypes";

/**
 * "Compromised bot account": Disable (default — sessions revoked, sign-in blocked, data kept) or
 * Purge (irreversible). The bot is blocked afterwards and its open incidents closed. Centred from
 * 700px; a bottom sheet on a phone, the destructive button last.
 */
const CloseAccountModal = ({ app, bot, incident, intercepted }: CloseAccountModalProps) => {
  const router = useRouter();
  const show = useToastStore((state) => state.show);
  const [closure, setClosure] = useState<string>(ACCOUNT_CLOSURE.disable);
  const [pending, start] = useTransition();
  useScrollLock(true);
  const purge = closure === ACCOUNT_CLOSURE.purge;
  const leave = () => (intercepted ? router.back() : router.push(appPath(app, PANEL_VIEW.overview)));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && leave();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const submit = () =>
    start(async () => {
      const result = await closeAccount({ app, bot: bot.id, purge });
      show(result.ok ? CLOSE_TEXT.done(bot.email, purge) : (result.message ?? CLOSE_TEXT.done(bot.email, purge)));
      if (result.ok) leave();
      router.refresh();
    });

  return (
    <div className="fixed inset-0 z-12 grid items-end justify-items-stretch tablet:place-items-center tablet:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-scrim-strong"
        onClick={leave}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={incident ? CLOSE_TEXT.compromised : CLOSE_TEXT.disableTitle}
        data-testid="close-account-modal"
        className="relative max-h-sheet-max w-full overflow-y-auto overscroll-y-none rounded-t-card border border-b-0 border-line bg-panel px-gut pt-3 pb-sheet-bottom before:mx-auto before:mb-4 before:block before:h-1 before:w-9 before:rounded-xs before:bg-line tablet:max-w-modal tablet:rounded-card tablet:border-b tablet:p-5.5 tablet:before:hidden"
      >
        <h3 className="m-0 mb-2 text-base font-semibold">
          {incident ? CLOSE_TEXT.compromised : CLOSE_TEXT.disableTitle}
        </h3>
        <p className="m-0 mb-3.5 text-body text-muted">
          <span className="font-mono text-text">{bot.email}</span>
          {incident && (
            <>
              {CLOSE_TEXT.attempts(incident.attempts)}
              <span className="font-mono">{incident.ip}</span>
            </>
          )}
        </p>
        <ClosureOption
          testId="closure-disable"
          checked={!purge}
          onSelect={() => setClosure(ACCOUNT_CLOSURE.disable)}
          title={
            <>
              {CLOSE_TEXT.disable} <span className="text-dim">{CLOSE_TEXT.byDefault}</span>
            </>
          }
          description={CLOSE_TEXT.disableSub}
        />
        <ClosureOption
          testId="closure-purge"
          checked={purge}
          onSelect={() => setClosure(ACCOUNT_CLOSURE.purge)}
          title={CLOSE_TEXT.purge}
          description={CLOSE_TEXT.purgeSub}
        />
        {bot.kind === BOT_KIND.daily && <p className="m-0 mt-1 font-mono text-xs text-warn">{CLOSE_TEXT.daily}</p>}
        <div className="mt-4 flex flex-col gap-2 tablet:flex-row tablet:justify-end">
          <Button
            variant={BUTTON_VARIANT.ghost}
            onClick={leave}
            className="h-11 w-full justify-center tablet:h-8 tablet:w-auto"
          >
            {CLOSE_TEXT.cancel}
          </Button>
          <Button
            variant={BUTTON_VARIANT.danger}
            onClick={submit}
            disabled={pending}
            data-testid="close-account-submit"
            className="h-11 w-full justify-center tablet:h-8 tablet:w-auto"
          >
            {purge ? CLOSE_TEXT.doPurge : CLOSE_TEXT.doDisable}
            {incident ? CLOSE_TEXT.andAck : ""}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CloseAccountModal;
