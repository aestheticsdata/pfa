"use client";

import AuthBrand from "@components/auth/AuthBrand";
import AuthCard from "@components/auth/AuthCard";
import app from "@text/app";

const { about: t } = app;

const LEGAL = [t.legal.host, t.legal.address, t.legal.ape, t.legal.vat];

export default function About() {
  return (
    <AuthCard>
      <AuthBrand
        title={t.title}
        subtitle="Personal Finance Assistant"
      />

      <ul className="flex flex-col gap-2.5 text-sm text-ink-2">
        {LEGAL.map((line) => (
          <li
            key={line}
            className="border-l-2 border-line pl-3 leading-relaxed"
          >
            {line}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-white/[0.07] pt-4.5 text-center font-mono text-xs text-ink-4">
        pfa · 1991computer.com
      </div>
    </AuthCard>
  );
}
