import type frNavBar from "@text/fr/navBar";

const navBar: typeof frNavBar = {
  today: "Today",
  currentMonth: "Current month",
  links: {
    dashboard: "Dashboard",
    spendings: "Spendings",
    exceptionals: "Exceptionals",
    categories: "Categories",
    statistics: "Statistics",
    about: "About",
  },
  aria: {
    openMenu: "Open menu",
    drawer: "Navigation",
    closeMenu: "Close menu",
  },
  userMenu: {
    changePassword: "Change password",
    language: "Language",
    languageUpdateError: "Could not save language",
    logout: "Log out",
  },
};

export default navBar;
