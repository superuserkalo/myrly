"use server";

import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type CurrentUser = {
    id: string;
    email: string | null;
} | null;

/**
 * Get the current authenticated user from our custom session cookie
 */
export async function getCurrentUser(): Promise<CurrentUser> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wos-session");

        if (!sessionCookie?.value) {
            console.log("[Auth] No session cookie found");
            return null;
        }

        const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
        if (!cookiePassword || cookiePassword.length < 32) {
            console.error("[Auth] Missing WORKOS_COOKIE_PASSWORD");
            return null;
        }

        // Unseal the session data
        const { unsealData } = await import("iron-session");
        const sessionData = await unsealData<{
            accessToken: string;
            refreshToken: string;
            user: { id: string; email?: string };
        }>(sessionCookie.value, {
            password: cookiePassword,
        });

        if (sessionData?.user) {
            console.log("[Auth] Session user found:", sessionData.user.id);
            return {
                id: sessionData.user.id,
                email: sessionData.user.email || null,
            };
        }

        console.log("[Auth] No user in session data");
        return null;
    } catch (error) {
        console.error("[Auth] Error reading session:", error);
        return null;
    }
}

export type OnboardingAnswers = {
    purpose: "work" | "school" | "personal";
    role: string;
    discoverySource: string;
    referralCode?: string;
    invitedEmails: string[];
    workspaceName: string;
};

export type OnboardingResult = {
    success: boolean;
    error?: string;
    workspaceId?: string;
};

/**
 * Complete onboarding - creates workspace and saves responses
 */
export async function completeOnboarding(
    answers: OnboardingAnswers
): Promise<OnboardingResult> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error("[Onboarding] No authenticated user found");
            return { success: false, error: "Not authenticated. Please sign in again." };
        }

        console.log("[Onboarding] Completing for user:", user.id);

        const result = await convex.mutation(api.onboarding.completeOnboarding, {
            authProvider: "workos",
            authUserId: user.id,
            answers,
        });

        console.log("[Onboarding] Completed, workspace:", result.workspaceId);

        return {
            success: true,
            workspaceId: result.workspaceId,
        };
    } catch (error) {
        console.error("[Onboarding] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to complete onboarding",
        };
    }
}

/**
 * Start onboarding (mark as in progress)
 */
export async function startOnboarding(): Promise<{ success: boolean }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false };
        }

        await convex.mutation(api.onboarding.startOnboarding, {
            authProvider: "workos",
            authUserId: user.id,
        });

        return { success: true };
    } catch {
        return { success: false };
    }
}
