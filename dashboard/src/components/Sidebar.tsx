"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reviews", label: "Reviews" },
  { href: "/branches", label: "Branches" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-stone-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 px-4 py-4 lg:px-5 lg:py-6">
        <Link href="/dashboard" className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-ink">Sarap.ai</span>
          <span className="rounded-md bg-mint px-2 py-1 text-xs font-semibold text-white">MVP</span>
        </Link>

        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-ink text-white" : "text-stone-600 hover:bg-field hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden h-1 rounded-full bg-mint lg:block" />
      </div>
    </aside>
  );
}
