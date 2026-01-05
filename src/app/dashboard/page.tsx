"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Folder,
  Grid2X2,
  LayoutGrid,
  List,
  Search,
  Star,
  Trash2,
  User,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-[100svh] bg-[#2b2b2b] text-[#e6e6e6]">
      <div className="flex min-h-[100svh]">
        <aside className="w-[260px] shrink-0 border-r border-white/10 bg-[#2a2a2a] px-4 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f97316] text-xs font-semibold">
              K
            </span>
            <span>Kalo</span>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-xs text-white/60">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-xs text-white/80 placeholder:text-white/40 focus:outline-none"
            />
          </div>

          <nav className="mt-4 space-y-1 text-xs text-white/70">
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
              <LayoutGrid className="h-4 w-4" />
              Recents
            </button>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
              <Users className="h-4 w-4" />
              Community
            </button>
          </nav>

          <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">
            <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] text-white">
                  g
                </span>
                <span className="truncate">gantchevkaloyan...</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                Free
              </span>
            </div>

            <div className="mt-3 space-y-1">
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
                <Folder className="h-4 w-4" />
                Drafts
              </button>
              <button className="flex w-full items-center gap-2 rounded-md bg-blue-500/20 px-2 py-2 text-left text-white">
                <Grid2X2 className="h-4 w-4" />
                All projects
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
                <Star className="h-4 w-4" />
                Resources
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
                <Trash2 className="h-4 w-4" />
                Trash
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            <p className="text-white/80">
              Ready to go beyond this free plan? Upgrade for premium features.
            </p>
            <button className="mt-3 w-full rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white">
              View plans
            </button>
          </div>

          <div className="mt-6 text-[11px] text-white/40">Starred</div>

          <div className="mt-10 flex items-center gap-2 text-xs text-white/70">
            <Link
              href="/dashboard/settings"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-white/5"
            >
              <User className="h-4 w-4" />
              <span>Account</span>
            </Link>
          </div>
        </aside>

        <section className="flex-1 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500 text-sm">
                g
              </span>
              <span>gantchevkaloyan&apos;s team</span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-md bg-blue-500 px-4 py-2 text-xs font-semibold text-white">
                + Project
              </button>
              <button className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-white/80">
                Share
              </button>
              <button className="rounded-md border border-white/10 p-2 text-white/70">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 text-xs text-white/60">
            <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
              Last modified
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 p-1.5">
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 p-1.5">
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/board"
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
            >
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#1f1f1f] p-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`preview-${index}`}
                    className="h-16 rounded-lg bg-[#2b2b2b]"
                  />
                ))}
                <div className="flex h-16 items-center justify-center rounded-lg bg-[#2b2b2b] text-blue-400">
                  +
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                Team project
              </div>
              <div className="text-xs text-white/50">2 files</div>
            </Link>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#1f1f1f] p-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`upgrade-${index}`}
                    className="h-16 rounded-lg bg-[#2b2b2b]"
                  />
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                Upgrade to create more projects
              </div>
              <div className="text-xs text-white/50">
                Get unlimited everything on the Professional plan.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
