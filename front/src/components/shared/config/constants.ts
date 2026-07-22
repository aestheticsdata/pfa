import type { Dictionary } from "@text/index";

/** Key into navBar.links — resolved to the active-locale label via useTranslations("navBar"). */
export type NavLabelKey = keyof Dictionary["navBar"]["links"];

export const ROUTES = {
  dashboard: { path: "/dashboard", labelKey: "dashboard" as NavLabelKey },
  spendings: { path: "/spendings", labelKey: "spendings" as NavLabelKey },
  exceptionals: { path: "/exceptionals", labelKey: "exceptionals" as NavLabelKey },
  categories: { path: "/categories", labelKey: "categories" as NavLabelKey },
  statistics: { path: "/statistics", labelKey: "statistics" as NavLabelKey },
  login: { path: "/login", label: "Login" },
  signup: { path: "/signup", label: "Signup" },
  changePassword: { path: "/changepassword", label: "Change password" },
  forgotPassword: { path: "/forgotPassword", label: "Forgot password" },
  about: { path: "/about", labelKey: "about" as NavLabelKey },
};
