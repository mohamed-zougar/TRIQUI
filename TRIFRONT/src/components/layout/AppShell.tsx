"use client";

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ListChecks,
  LogOut,
  Package,
  Plus,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { logout } from "@/lib/auth";
import type { AuthSummary } from "@/lib/api";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  matches?: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/client",
    label: "Requests",
    icon: Package,
    matches: (p) => p.startsWith("/client"),
  },
  {
    href: "/shipper",
    label: "Trips",
    icon: Truck,
    matches: (p) => p.startsWith("/shipper"),
  },
  {
    href: "/my-posts",
    label: "My posts",
    icon: ListChecks,
    matches: (p) => p.startsWith("/my-posts") || p.startsWith("/post"),
  },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export interface AppShellProps {
  user: AuthSummary | null;
  children: React.ReactNode;
  showNav?: boolean;
}

export function AppShell({ user, children, showNav = true }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)] pb-20 lg:pb-0">
      {/* Mobile Top Brand Bar */}
      <div className="sticky top-0 z-40 bg-[var(--color-brand-500)] px-4 py-3 shadow-md lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Welcome back</span>
            <h2 className="text-lg font-black text-white leading-tight">
              {user?.firstName || "User"}
            </h2>
          </div>
          <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm">
            <Avatar
              src={user?.profilePictureUrl}
              name={`${user?.firstName} ${user?.lastName ?? ""}`}
              size={32}
            />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-30 hidden border-b border-[var(--color-border)] bg-white/95 backdrop-blur lg:block">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <Link href="/client" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              <span className="text-[var(--color-brand-500)]">Tri</span>QI+
            </span>
          </Link>

          {showNav ? (
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = item.matches ? item.matches(pathname) : pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                        : "text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)]"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/post"
                className="ml-2 inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
              >
                <Plus size={16} />
                New post
              </Link>
            </nav>
          ) : null}

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white pl-1 pr-3 py-1 text-sm font-medium text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <Avatar
                  src={user.profilePictureUrl}
                  name={`${user.firstName} ${user.lastName ?? ""}`}
                  size={28}
                />
                <span className="hidden sm:inline">{user.firstName}</span>
              </Link>
            ) : null}
            {showNav ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-9 items-center gap-1 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)] sm:inline-flex"
              >
                <LogOut size={16} />
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main>{children}</main>

      {showNav ? <BottomNav pathname={pathname} /> : null}
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Creation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-1000 ease-in-out animate-in slide-in-from-bottom-[500px]" 
          >
            <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-border)]">
              <Link
                href="/post/shipper"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-subtle)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-600)]">
                  <Truck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[var(--color-fg-primary)]">Offer a trip</span>
                  <span className="text-xs text-[var(--color-fg-muted)]">Post your vehicle availability</span>
                </div>
              </Link>
              <div className="h-px bg-[var(--color-border)] opacity-50 mx-2" />
              <Link
                href="/post/client"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-subtle)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Package size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[var(--color-fg-primary)]">Request delivery</span>
                  <span className="text-xs text-[var(--color-fg-muted)]">Post items you need to move</span>
                </div>
              </Link>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-white font-semibold text-[var(--color-fg-primary)] shadow-sm border border-[var(--color-border)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-white pb-[max(env(safe-area-inset-bottom),0.25rem)] lg:hidden">
        <div className="relative grid h-16 grid-cols-5 items-stretch">
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const isActive = item.matches ? item.matches(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  isActive ? "text-[var(--color-brand-500)]" : "text-[var(--color-fg-muted)]"
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white shadow-lg transition-transform active:scale-95",
                isOpen && "rotate-45 bg-[var(--color-fg-primary)]"
              )}
            >
              <Plus size={24} />
            </button>
          </div>

          {NAV_ITEMS.slice(2).map((item) => {
            const isActive = item.matches ? item.matches(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  isActive ? "text-[var(--color-brand-500)]" : "text-[var(--color-fg-muted)]"
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function PageHeader({
  title,
  description,
  trailing,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  back?: { href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {back ? <BackButton href={back.href} onClick={back.onClick} /> : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

export function BackButton({ href, onClick }: { href?: string; onClick?: () => void }) {
  const router = useRouter();
  const handle = () => {
    if (onClick) return onClick();
    if (href) return router.push(href);
    router.back();
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)]"
      aria-label="Go back"
    >
      <ArrowLeft size={16} />
    </button>
  );
}
