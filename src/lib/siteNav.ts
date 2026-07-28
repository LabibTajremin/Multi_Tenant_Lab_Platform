// Single source of truth for the public site's primary navigation. Shared by
// the header, the (optional) footer nav, and the sitemap generator so a route
// is never listed in one place but forgotten in another.
export interface NavLink {
  href: string;
  label: string;
}

export const SITE_NAV_LINKS: NavLink[] = [
  { href: '/research', label: 'Research' },
  { href: '/people', label: 'People' },
  { href: '/publications', label: 'Publications' },
  { href: '/news', label: 'News' },
  { href: '/funding', label: 'Funding' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];
