"use client";

import { botsHref } from "@components/panel/bots/botsQuery";
import { BOT_VIEW_STATE, POPULATION } from "@contracts/panel";
import { cx } from "@lib/classNames/cx";
import { BOTS_TEXT } from "@text/bots";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ToolbarProps } from "@components/panel/bots/interfaces/botsTypes";

const SEARCH_DELAY_MS = 250;
const CHIP =
  "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.25 text-note no-underline tablet:h-7 tablet:px-2.75";

/**
 * Population chips · state chips with counts · search. Filters live in the URL, so a filtered view
 * survives a reload and can be shared. Stacked on a phone, the state chips scrolling sideways.
 */
const Toolbar = ({ app, data, filters }: ToolbarProps) => {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  useEffect(() => {
    if (q === filters.q) return;
    const timer = setTimeout(
      () => router.replace(botsHref(app, { ...filters, q, page: 0 }), { scroll: false }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [q, filters, app, router]);

  const states = [
    "all",
    ...(data.running ? [] : [BOT_VIEW_STATE.stopped]),
    BOT_VIEW_STATE.running,
    BOT_VIEW_STATE.degraded,
    BOT_VIEW_STATE.paused,
    BOT_VIEW_STATE.queued,
    BOT_VIEW_STATE.blocked,
  ];
  const inPopulation = data.counts.population[filters.population] ?? 0;
  const chip = (current: boolean) =>
    cx(
      CHIP,
      current ? "border-ok-d bg-okbg text-ok" : "border-line bg-panel2 text-muted hover:bg-hover hover:text-text",
    );
  const countClass = (current: boolean) => cx("font-mono text-tiny", current ? "text-ok opacity-80" : "text-dim");

  return (
    <div className="flex flex-col items-stretch gap-2.5 px-3.5 py-2.5 tablet:flex-row tablet:flex-wrap tablet:items-center">
      <div className="flex flex-wrap gap-1.5">
        {[POPULATION.all, POPULATION.daily, POPULATION.load].map((population) => (
          <Link
            key={population}
            href={botsHref(app, { ...filters, population, page: 0 })}
            scroll={false}
            className={chip(filters.population === population)}
          >
            {BOTS_TEXT.population[population]}
            <span className={countClass(filters.population === population)}>
              {data.counts.population[population] ?? 0}
            </span>
          </Link>
        ))}
      </div>
      <span className="hidden h-5 w-px bg-line tablet:block" />
      <div className="no-scrollbar -mx-3.5 flex gap-1.5 overflow-x-auto overscroll-x-contain px-3.5 tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0">
        {states.map((state) => (
          <Link
            key={state}
            href={botsHref(app, { ...filters, state, page: 0 })}
            scroll={false}
            className={chip(filters.state === state)}
          >
            {BOTS_TEXT.states[state as keyof typeof BOTS_TEXT.states]}
            <span className={countClass(filters.state === state)}>
              {state === "all" ? inPopulation : (data.counts.state[state] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
      <span className="hidden flex-1 tablet:block" />
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={BOTS_TEXT.search}
        aria-label={BOTS_TEXT.search}
        className="h-10 w-full rounded-ctl border border-line bg-bg px-2.5 font-mono text-base text-text focus:border-ok-d tablet:h-7.5 tablet:text-note desktop:w-60"
      />
    </div>
  );
};

export default Toolbar;
