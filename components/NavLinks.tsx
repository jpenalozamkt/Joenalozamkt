"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { NavItem } from "@/lib/nav";

export function NavLinks({ items, label }: { items: NavItem[]; label?: string }) {
  const path = usePathname();
  if (!items.length) return null;
  return (
    <nav className="nav" aria-label={label ?? "Secciones"}>
      {label && <span className="nav-label">{label}</span>}
      {items.map((it) => (
        <Link key={it.href} href={it.href} aria-current={path.startsWith(it.href) ? "page" : undefined}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
