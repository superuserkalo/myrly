"use server";

import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Check if user has an active session and get their workspace for redirect
 */
export async function checkSession(): Promise<{
    isLoggedIn: boolean;
    redirectUrl: string | null;
}> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wos-session");

        if (!sessionCookie?.value) {
            return { isLoggedIn: false, redirectUrl: null };
        }

        const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
        if (!cookiePassword || cookiePassword.length < 32) {
            return { isLoggedIn: true, redirectUrl: "/dashboard" };
        }

        const { unsealData } = await import("iron-session");
        const sessionData = await unsealData<{
            accessToken: string;
            refreshToken: string;
            user: { id: string; email?: string };
        }>(sessionCookie.value, {
            password: cookiePassword,
        });

        if (sessionData?.user) {
            // Look up user's workspace from Convex
            try {
                const status = await convex.query(api.users.checkOnboardingStatus, {
                    authProvider: "workos",
                    authUserId: sessionData.user.id,
                });

                if (status.workspaceId) {
                    return {
                        isLoggedIn: true,
                        redirectUrl: `/workspaces/${status.workspaceId}/dashboard`
                    };
                }
            } catch (e) {
                console.error("[Auth] Error fetching workspace:", e);
            }

            // Fallback if no workspace found
            return { isLoggedIn: true, redirectUrl: "/dashboard" };
        }

        return { isLoggedIn: false, redirectUrl: null };
    } catch {
        return { isLoggedIn: false, redirectUrl: null };
    }
}
