"use client";

import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-[100svh] bg-[var(--white)]">
            {/* Left side - Animated gradient visual */}
            <div className="relative hidden w-1/2 overflow-hidden bg-[#f8f6f2] lg:flex">
                {/* Gradient orbs */}
                <div className="absolute inset-0">
                    <div
                        className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full opacity-80 blur-[80px]"
                        style={{
                            background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
                        }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full opacity-60 blur-[100px]"
                        style={{
                            background: "linear-gradient(225deg, #f472b6 0%, #a855f7 50%, #6366f1 100%)",
                        }}
                    />
                </div>

                {/* Logo and tagline */}
                <div className="relative z-10 flex flex-col justify-between p-12">
                    <img
                        src="/moooday_black-removed.png"
                        alt="Mooody"
                        className="h-10 w-auto"
                    />
                    <div className="max-w-md">
                        <h2 className="text-2xl font-semibold text-[color:var(--charcoal)]">
                            Your creative AI studio.
                        </h2>
                        <p className="mt-2 text-sm text-[color:var(--grey)]">
                            Generate, curate, and present visuals that match your vision.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Auth form */}
            <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
