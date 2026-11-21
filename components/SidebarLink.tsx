"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function SidebarLink({ href, children }: { href: string; children: ReactNode }) {
    const pathname = usePathname();
    const active = pathname === href;

    return (
        <Link href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            {children}
        </Link>
    );
}