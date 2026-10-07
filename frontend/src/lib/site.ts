/**
 * This site's name and wording. Everything that names the site reads it from here, so a league changes it in
 * one place.
 */
export const site = {
  /** The name in the browser title, the menu, the login screen and the footer. */
  name: 'Liga Demo',
  /** A short form of the name for the header, where a phone has room for a few letters only. */
  shortName: 'Liga',
  /** A line below the name on the login screen. Empty: no line. */
  tagline: 'Liga de pôquer entre amigos',
  /** What a night is called in its title: "Liga - 14/03/2026". */
  nightTitlePrefix: 'Liga',
  /** A character shown next to the name. */
  logo: '♠',
} as const
