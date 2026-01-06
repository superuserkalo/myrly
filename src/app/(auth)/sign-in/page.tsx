"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, getOAuthUrl } from "../actions";

export default function SignInPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAppleSignIn = async () => {
        const url = await getOAuthUrl("AppleOAuth", "sign-in");
        window.location.href = url;
    };

    const handleGoogleSignIn = async () => {
        const url = await getOAuthUrl("GoogleOAuth", "sign-in");
        window.location.href = url;
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }
        if (!password) {
            setError("Please enter your password");
            return;
        }

        startTransition(async () => {
            const result = await signInWithEmail(email, password);
            if (result.success && result.redirectTo) {
                router.push(result.redirectTo);
            } else {
                setError(result.error || "Sign in failed");
            }
        });
    };

    return (
        <>
            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
                <img
                    src="/moooday_black-removed.png"
                    alt="Mooody"
                    className="h-8 w-auto"
                />
            </div>

            <h1 className="text-2xl font-semibold text-[color:var(--charcoal)]">
                Sign in
            </h1>

            <div className="mt-8 space-y-3">
                <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 text-sm font-medium text-[color:var(--charcoal)] transition hover:bg-[color:var(--charcoal)]/5 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Sign in with Apple
                </button>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 text-sm font-medium text-[color:var(--charcoal)] transition hover:bg-[color:var(--charcoal)]/5 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign in with Google
                </button>
            </div>

            <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[color:var(--charcoal)]/10" />
                <span className="text-xs text-[color:var(--grey)]">or</span>
                <div className="h-px flex-1 bg-[color:var(--charcoal)]/10" />
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@studio.com"
                        disabled={isPending}
                        className="w-full rounded-lg border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--grey)] focus:border-[color:var(--charcoal)]/40 disabled:opacity-50"
                    />
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-[color:var(--grey)] focus:border-[color:var(--charcoal)]/40 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--grey)]"
                    >
                        {showPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-[color:var(--charcoal)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-[color:var(--grey)]">
                Don't have an account?{" "}
                <Link
                    href="/sign-up"
                    className="font-semibold text-[color:var(--charcoal)] hover:underline"
                >
                    Sign up
                </Link>
            </p>
        </>
    );
}
