/** A site's settings, as written in its site.json (see site/README.md). */
export interface SiteFile {
  name: string
  shortName?: string
  tagline?: string
  nightTitlePrefix?: string
  logo?: string
  locale: string
  currency: string
  timeZone: string
  brandColor: string
  siteDomain?: string
}

/** The settings the app runs with: the file's, with every default filled in. */
export interface SiteSettings {
  /** The name in the browser title, the menu, the login screen and the footer. */
  name: string
  /** A short form of the name for the header, where a phone has room for a few letters only. */
  shortName: string
  /** A line below the name on the login screen. Empty: no line. */
  tagline: string
  /** What a night is called in its title: "Liga - 14/03/2026". */
  nightTitlePrefix: string
  /** A character shown next to the name. */
  logo: string
  /** The language and formats, as a BCP 47 tag: "pt-BR". */
  locale: string
  /** The money, as an ISO 4217 code: "BRL". */
  currency: string
  /** The league's time zone: "America/Sao_Paulo". */
  timeZone: string
  /** The main color, "#rrggbb". */
  brandColor: string
}
