"use client";

import useNow from "@components/hooks/useNow";
import IncidentItem from "@components/panel/banner/IncidentItem";
import Dot from "@components/ui/Dot";
import { TONE } from "@components/ui/variants";
import { PANEL_TEXT } from "@text/panel";

import type { IncidentBannerProps } from "@components/panel/banner/interfaces/bannerTypes";

/** On every page while an incident is open: "N bot accounts used outside ks-b", one row each. */
const IncidentBanner = ({ app, host, incidents }: IncidentBannerProps) => {
  const now = useNow(5000);
  if (incidents.length === 0) return null;
  return (
    <section
      role="alert"
      data-testid="incident-banner"
      className="mt-4 overflow-hidden rounded-card border border-bad/55 bg-badbg"
    >
      <header className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 font-semibold text-text">
        <Dot tone={TONE.bad} />
        <span>{PANEL_TEXT.banner.title(incidents.length, host)}</span>
        <span className="flex-1" />
        <small className="font-mono text-xs font-normal text-badtx">{PANEL_TEXT.banner.source}</small>
      </header>
      {incidents.map((incident) => (
        <IncidentItem
          key={incident.id}
          app={app}
          incident={incident}
          now={now}
        />
      ))}
    </section>
  );
};

export default IncidentBanner;
