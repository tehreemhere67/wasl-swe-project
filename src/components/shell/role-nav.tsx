"use client";

import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Role-specific navigation - IR-02. The active item is the longest matching
 * route so that e.g. /hospital/search highlights "Search blood" and not the
 * dashboard.
 */
export function RoleNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "/";

  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const active = matches.sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="no-print border-b border-ink-200 bg-white" aria-label="Primary">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = active?.href === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link whitespace-nowrap ${isActive ? "nav-link-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
