"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Delete user account from WorkOS and Convex, then sign out
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wos-session");

        if (!sessionCookie?.value) {
            return { success: false, error: "Not authenticated" };
        }

        const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
        if (!cookiePassword || cookiePassword.length < 32) {
            return { success: false, error: "Invalid configuration" };
        }

        // Unseal session to get user info
        const { unsealData } = await import("iron-session");
        const sessionData = await unsealData<{
            accessToken: string;
            refreshToken: string;
            user: { id: string; email?: string };
        }>(sessionCookie.value, {
            password: cookiePassword,
        });

        if (!sessionData?.user?.id) {
            return { success: false, error: "Invalid session" };
        }

        const workosUserId = sessionData.user.id;

        // 1. Delete from WorkOS
        try {
            await workos.userManagement.deleteUser(workosUserId);
            console.log("[Settings] Deleted user from WorkOS:", workosUserId);
        } catch (error) {
            console.error("[Settings] Error deleting from WorkOS:", error);
            // Continue anyway - user might already be deleted
        }

        // 2. Delete from Convex
        try {
            await convex.mutation(api.users.deleteUser, {
                authProvider: "workos",
                authUserId: workosUserId,
            });
            console.log("[Settings] Deleted user from Convex:", workosUserId);
        } catch (error) {
            console.error("[Settings] Error deleting from Convex:", error);
            // Continue anyway
        }

        // 3. Clear session cookie
        cookieStore.delete("wos-session");

        return { success: true };
    } catch (error) {
        console.error("[Settings] Error deleting account:", error);
        return { success: false, error: "Failed to delete account" };
    }
}

/**
 * Get current user info for settings page
 */
export async function getCurrentUserForSettings(): Promise<{
    isLoggedIn: boolean;
    email?: string;
    userId?: string;
}> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wos-session");

        if (!sessionCookie?.value) {
            return { isLoggedIn: false };
        }

        const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
        if (!cookiePassword || cookiePassword.length < 32) {
            return { isLoggedIn: false };
        }

        const { unsealData } = await import("iron-session");
        const sessionData = await unsealData<{
            accessToken: string;
            refreshToken: string;
            user: { id: string; email?: string };
        }>(sessionCookie.value, {
            password: cookiePassword,
        });

        if (!sessionData?.user) {
            return { isLoggedIn: false };
        }

        return {
            isLoggedIn: true,
            email: sessionData.user.email,
            userId: sessionData.user.id,
        };
    } catch {
        return { isLoggedIn: false };
    }
}
