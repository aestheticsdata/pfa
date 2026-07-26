// Locale dictionaries (COS-155). The FR tree is the source of truth for the
// shape; every EN module is typed `typeof <fr module>`, so a missing key or a
// diverging interpolation signature is a type error. Consumers never import
// zone modules directly — they go through `useTranslations("<zone>")`.

import enApp from "@text/en/app";
import enCategories from "@text/en/categories";
import enCommon from "@text/en/common";
import enDashboard from "@text/en/dashboard";
import enExceptionals from "@text/en/exceptionals";
import enLogin from "@text/en/login";
import enNavBar from "@text/en/navBar";
import enSpendingSearch from "@text/en/spendingSearch";
import enSpendings from "@text/en/spendings";
import enStatistics from "@text/en/statistics";
import frApp from "@text/fr/app";
import frCategories from "@text/fr/categories";
import frCommon from "@text/fr/common";
import frDashboard from "@text/fr/dashboard";
import frExceptionals from "@text/fr/exceptionals";
import frLogin from "@text/fr/login";
import frNavBar from "@text/fr/navBar";
import frSpendingSearch from "@text/fr/spendingSearch";
import frSpendings from "@text/fr/spendings";
import frStatistics from "@text/fr/statistics";

import type { LangKeys } from "@i18n/interfaces/localesTypes";

const fr = {
  app: frApp,
  categories: frCategories,
  common: frCommon,
  dashboard: frDashboard,
  exceptionals: frExceptionals,
  login: frLogin,
  navBar: frNavBar,
  spendingSearch: frSpendingSearch,
  spendings: frSpendings,
  statistics: frStatistics,
};

export type Dictionary = typeof fr;
export type TextZone = keyof Dictionary;

export const dictionaries: Record<LangKeys, Dictionary> = {
  fr,
  en: {
    app: enApp,
    categories: enCategories,
    common: enCommon,
    dashboard: enDashboard,
    exceptionals: enExceptionals,
    login: enLogin,
    navBar: enNavBar,
    spendingSearch: enSpendingSearch,
    spendings: enSpendings,
    statistics: enStatistics,
  },
};
