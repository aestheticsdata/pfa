import navBar from "@text/navBar";

const { links } = navBar;

export const ROUTES = {
  dashboard: { path: "/dashboard", label: links.dashboard },
  spendings: { path: "/spendings", label: links.spendings },
  exceptionals: { path: "/exceptionals", label: links.exceptionals },
  categories: { path: "/categories", label: links.categories },
  statistics: { path: "/statistics", label: links.statistics },
  login: { path: "/login", label: "Login" },
  signup: { path: "/signup", label: "Signup" },
  changePassword: { path: "/changepassword", label: "Change password" },
  forgotPassword: { path: "/forgotPassword", label: "Forgot password" },
  about: { path: "/about", label: links.about },
};
