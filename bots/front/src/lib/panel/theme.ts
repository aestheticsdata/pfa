/** The theme class of an app; null = the bot-runner identity (handoff §1, fallback). */
export const themeClass = (theme: string | null): string => (theme ? `theme-${theme}` : "theme-runner");
