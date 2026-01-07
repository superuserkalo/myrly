import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionUser {
    id: string;
    email?: string;
}

export interface Session {
    accessToken: string;
    refreshToken: string;
    user: SessionUser;
}

/**
 * Get the current session from the cookie.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<Session | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wos-session");

        if (!sessionCookie?.value) {
            return null;
        }

        const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
        if (!cookiePassword || cookiePassword.length < 32) {
            console.error("[Auth] Invalid WORKOS_COOKIE_PASSWORD");
            return null;
        }

        const { unsealData } = await import("iron-session");

        const sessionData = await unsealData<Session>(sessionCookie.value, {
            password: cookiePassword,
        });

        if (!sessionData?.user?.id) {
            return null;
        }

        return sessionData;
    } catch (error) {
        console.error("[Auth] Failed to get session:", error);
        return null;
    }
}

/**
 * Get the current session user.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Require authentication. Redirects to sign-in if not authenticated.
 * Use this in server components that need auth.
 */
export async function requireAuth(redirectPath?: string): Promise<Session> {
    const session = await getSession();

    if (!session) {
        const signInUrl = redirectPath
            ? `/sign-in?redirect=${encodeURIComponent(redirectPath)}`
            : "/sign-in";
        redirect(signInUrl);
    }

    return session;
}

/**
 * Clear the session cookie.
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("wos-session");
}
