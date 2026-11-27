"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function SidebarLink({
  href,
  all,
  children,
}: {
  href: string;
  all: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const matches = all.filter((h) => pathname === h || pathname.startsWith(`${h}/`));
  const best = matches.sort((a, b) => b.length - a.length)[0];
  const active = best === href;

  return (
    <Link href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}