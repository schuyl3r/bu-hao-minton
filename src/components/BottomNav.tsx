"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKeyboardVisible } from "@/lib/useKeyboardVisible";

const TABS = [
  { href: "/", label: "Session", icon: SessionIcon },
  { href: "/players", label: "Players", icon: PeopleIcon },
  { href: "/courts", label: "Courts", icon: CourtIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const keyboardVisible = useKeyboardVisible();

  // Give the field being typed into the full viewport instead of ceding a
  // chunk of it to a nav bar nobody can reach past the keyboard anyway.
  if (keyboardVisible) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-ink-raised/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide"
                aria-current={active ? "page" : undefined}
              >
                <Icon active={active} />
                <span
                  className={active ? "text-line" : "text-line-dim"}
                >
                  {label.toUpperCase()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function iconColor(active: boolean) {
  return active ? "var(--color-court-bright)" : "var(--color-line-dim)";
}

function CourtIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1.5" stroke={iconColor(active)} strokeWidth="1.6" />
      <line x1="12" y1="4" x2="12" y2="20" stroke={iconColor(active)} strokeWidth="1.6" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={iconColor(active)} strokeWidth="1.6" />
    </svg>
  );
}

function PeopleIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke={iconColor(active)} strokeWidth="1.6" />
      <path
        d="M3.5 20c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5"
        stroke={iconColor(active)}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.2" stroke={iconColor(active)} strokeWidth="1.6" />
      <path
        d="M15.5 20c.5-2.3 1.8-4 3.8-4.4"
        stroke={iconColor(active)}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SessionIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke={iconColor(active)} strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke={iconColor(active)} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
