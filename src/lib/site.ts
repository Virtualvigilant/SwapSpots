/**
 * Site-wide configuration. Copy that appears in more than one place lives here
 * so the marketing shell and the app shell can never drift apart.
 */

export const site = {
  name: "SwapSpot",
  /** Rendered as two-tone wordmark: `nameLead` in ink, `nameTail` in brand. */
  nameLead: "Swap",
  nameTail: "Spot",
  tagline: "The campus marketplace",
  campus: "Kabarak University",
  whatsappNote: "Deals close on WhatsApp — we never touch your money.",
  /**
   * Where the contact form sends people. Change this in one place — the domain
   * is still an open decision (§15), so it is deliberately not scattered
   * through the marketing pages.
   */
  supportEmail: "hello@swapspot.co.ke",
} as const;

export type NavItem = {
  label: string;
  href: string;
  /** Renders a chevron; the dropdown itself is wired up in SiteHeader. */
  hasMenu?: boolean;
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Requests", href: "/requests" },
  { label: "Categories", href: "/categories", hasMenu: true },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const announcements = [
  { icon: "shield", text: "Every seller is a verified student" },
  { icon: "tag", text: "Zero commission — you keep 100%" },
  { icon: "zap", text: "Post a request, get bids in minutes" },
] as const;
