"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

type SocialLink = {
  href: string;
  label: string;
};

type MobileNavProps = {
  navItems: NavItem[];
  socialLinks: SocialLink[];
};

export function MobileNav({ navItems, socialLinks }: MobileNavProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => {
    const details = detailsRef.current;

    if (!details?.open) {
      return;
    }

    details.open = false;
    setOpen(false);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  return (
    <details
      ref={detailsRef}
      className="mobile-nav"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeMenu();
        }
      }}
    >
      <summary aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
        Menu
      </summary>
      <button
        className="mobile-nav-backdrop"
        type="button"
        aria-label="Close menu"
        onClick={closeMenu}
      />
      <div className="mobile-nav-panel">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu}>
            {item.label}
          </Link>
        ))}
        <div className="mobile-socials">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
