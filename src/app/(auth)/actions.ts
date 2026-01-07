"use server";

import { WorkOS } from "@workos-inc/node";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID!;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type AuthResult = {
    success: boolean;
    error?: string;
    redirectTo?: string;
    requiresVerification?: boolean;
    userId?: string;
    email?: string;
};

/**
 * Helper to set the WorkOS session cookie
 */
async function setSessionCookie(authResult: {
    accessToken: string;
    refreshToken: string;
    user: any;
}) {
    const { sealData } = await import("iron-session");

    const sessionData = {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        user: authResult.user,
    };

    const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
    if (!cookiePassword || cookiePassword.length < 32) {
        throw new Error("WORKOS_COOKIE_PASSWORD must be at least 32 characters");
    }

    const sealed = await sealData(sessionData, {
        password: cookiePassword,
        ttl: 60 * 60 * 24 * 90, // 90 days - standard for productivity apps
    });

    const cookieStore = await cookies();
    cookieStore.set("wos-session", sealed, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90, // 90 days
    });
}

/**
 * Helper to get or create user in Convex and determine redirect
 */
async function getRedirectForUser(workosUserId: string, email?: string): Promise<string> {
    // Get or create user in Convex
    const convexUser = await convex.mutation(api.users.getOrCreateUser, {
        authProvider: "workos",
        authUserId: workosUserId,
        email: email,
    });

    console.log("[Auth] Convex user:", convexUser?._id, "onboarding:", convexUser?.onboardingStatus);

    // Check onboarding status
    if (!convexUser || convexUser.onboardingStatus !== "complete") {
        return "/onboarding";
    }

    // Get workspace ID for redirect
    const workspaceId = convexUser.lastWorkspaceId || convexUser.defaultWorkspaceId;
    if (workspaceId) {
        return `/workspaces/${workspaceId}/dashboard`;
    }

    // Fallback - shouldn't happen if onboarding is complete
    return "/onboarding";
}

/**
 * Sign up with email and password - HEADLESS flow
 * Creates user, sends verification email, returns userId for verification step
 */
export async function signUpWithEmail(
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        console.log("[WorkOS] Creating user:", email);

        // Step 1: Create user with email/password in WorkOS
        const user = await workos.userManagement.createUser({
            email,
            password,
            emailVerified: false,
        });

        console.log("[WorkOS] User created:", user.id);

        // Step 2: Send verification email (6-digit code)
        await workos.userManagement.sendVerificationEmail({
            userId: user.id,
        });

        console.log("[WorkOS] Verification email sent to:", email);

        // Return success but require verification
        return {
            success: true,
            requiresVerification: true,
            userId: user.id,
            email: email,
        };
    } catch (error: unknown) {
        console.error("[WorkOS] Signup error:", error);

        let errorMessage = "Could not create account";

        if (error instanceof Error) {
            const errStr = error.toString().toLowerCase();

            if (errStr.includes("already exists") || errStr.includes("duplicate") || errStr.includes("user_exists")) {
                return { success: false, error: "This email is already registered. Try signing in instead." };
            }
            if (errStr.includes("password") && errStr.includes("weak")) {
                return { success: false, error: "Password is too weak. Use at least 8 characters." };
            }

            errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Verify email with 6-digit code
 */
export async function verifyEmailCode(
    userId: string,
    code: string,
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        console.log("[WorkOS] Verifying code for user:", userId);

        // Verify the email with the code
        await workos.userManagement.verifyEmail({
            userId,
            code,
        });

        console.log("[WorkOS] Email verified, authenticating");

        // Now authenticate to get session
        const authResult = await workos.userManagement.authenticateWithPassword({
            clientId,
            email,
            password,
        });

        console.log("[WorkOS] Auth successful, setting session");

        // Set the session cookie
        await setSessionCookie(authResult);

        // Create user in Convex and get redirect
        const redirectTo = await getRedirectForUser(authResult.user.id, email);

        return {
            success: true,
            redirectTo,
        };
    } catch (error: unknown) {
        console.error("[WorkOS] Verification error:", error);

        let errorMessage = "Verification failed";

        if (error instanceof Error) {
            const errStr = error.toString().toLowerCase();

            if (errStr.includes("invalid") || errStr.includes("code")) {
                return { success: false, error: "Invalid verification code. Please try again." };
            }
            if (errStr.includes("expired")) {
                return { success: false, error: "Code expired. Please request a new one." };
            }

            errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<AuthResult> {
    try {
        await workos.userManagement.sendVerificationEmail({
            userId,
        });
        return { success: true };
    } catch (error: unknown) {
        console.error("[WorkOS] Resend error:", error);
        return { success: false, error: "Could not resend code. Please try again." };
    }
}

/**
 * Sign in with email and password - HEADLESS flow
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        console.log("[WorkOS] Authenticating:", email);

        const authResult = await workos.userManagement.authenticateWithPassword({
            clientId,
            email,
            password,
        });

        console.log("[WorkOS] Auth successful for:", authResult.user.id);

        // Set the session cookie
        await setSessionCookie(authResult);

        // Get or create Convex user and determine redirect
        const redirectTo = await getRedirectForUser(authResult.user.id, email);

        console.log("[WorkOS] Redirecting to:", redirectTo);

        return {
            success: true,
            redirectTo,
        };
    } catch (error: unknown) {
        console.error("[WorkOS] Signin error:", error);

        let errorMessage = "Sign in failed";

        if (error instanceof Error) {
            const errStr = error.toString().toLowerCase();

            if (errStr.includes("invalid") || errStr.includes("credentials") || errStr.includes("password")) {
                return { success: false, error: "Invalid email or password" };
            }
            if (errStr.includes("not found") || errStr.includes("no user")) {
                return { success: false, error: "No account found with this email" };
            }
            if (errStr.includes("not verified") || errStr.includes("verify")) {
                return { success: false, error: "Please verify your email first" };
            }

            errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Get OAuth URL for a provider - Direct to Google/Apple, not AuthKit
 */
export async function getOAuthUrl(
    provider: "GoogleOAuth" | "AppleOAuth",
    mode: "sign-in" | "sign-up"
): Promise<string> {
    const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;

    const authUrl = workos.userManagement.getAuthorizationUrl({
        clientId,
        provider,
        redirectUri,
        state: JSON.stringify({ mode }),
    });

    return authUrl;
}
