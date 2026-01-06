"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function WorkspaceDashboard() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    return (
        <div className="min-h-screen bg-[var(--white)]">
            {/* Header */}
            <header className="border-b border-[color:var(--charcoal)]/10 px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-6">
                        <img
                            src="/moooday_black-removed.png"
                            alt="Mooody"
                            className="h-8 w-auto"
                        />
                        <span className="text-sm font-medium text-[color:var(--charcoal)]">
                            Dashboard
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/workspaces/${workspaceId}/boards`}
                            className="text-sm text-[color:var(--grey)] hover:text-[color:var(--charcoal)]"
                        >
                            Boards
                        </Link>
                        <Link
                            href={`/workspaces/${workspaceId}/settings`}
                            className="text-sm text-[color:var(--grey)] hover:text-[color:var(--charcoal)]"
                        >
                            Settings
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-7xl px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-[color:var(--charcoal)]">
                        Welcome to Mooody
                    </h1>
                    <p className="mt-2 text-[color:var(--grey)]">
                        Your creative AI studio is ready. Start creating!
                    </p>
                </div>

                {/* Quick actions */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/board-2"
                        className="group rounded-2xl border border-[color:var(--charcoal)]/10 bg-white p-6 transition hover:border-[color:var(--charcoal)]/30 hover:shadow-lg"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--charcoal)] group-hover:text-violet-600">
                            New Board
                        </h3>
                        <p className="mt-1 text-sm text-[color:var(--grey)]">
                            Start a new creative canvas with AI generation
                        </p>
                    </Link>

                    <Link
                        href={`/workspaces/${workspaceId}/assets`}
                        className="group rounded-2xl border border-[color:var(--charcoal)]/10 bg-white p-6 transition hover:border-[color:var(--charcoal)]/30 hover:shadow-lg"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--charcoal)] group-hover:text-emerald-600">
                            Asset Library
                        </h3>
                        <p className="mt-1 text-sm text-[color:var(--grey)]">
                            Browse your saved images and assets
                        </p>
                    </Link>

                    <Link
                        href={`/workspaces/${workspaceId}/team`}
                        className="group rounded-2xl border border-[color:var(--charcoal)]/10 bg-white p-6 transition hover:border-[color:var(--charcoal)]/30 hover:shadow-lg"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--charcoal)] group-hover:text-orange-600">
                            Team
                        </h3>
                        <p className="mt-1 text-sm text-[color:var(--grey)]">
                            Manage your team members and invites
                        </p>
                    </Link>
                </div>

                {/* Recent boards placeholder */}
                <section className="mt-12">
                    <h2 className="mb-6 text-xl font-semibold text-[color:var(--charcoal)]">
                        Recent Boards
                    </h2>
                    <div className="rounded-2xl border border-dashed border-[color:var(--charcoal)]/20 bg-[color:var(--charcoal)]/5 p-12 text-center">
                        <p className="text-[color:var(--grey)]">
                            No boards yet. Create your first board to get started!
                        </p>
                        <Link
                            href="/board-2"
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Board
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
