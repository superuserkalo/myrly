import { handleAuth, withAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
    // Handle the WorkOS auth callback
    const response = await handleAuth()(request);

    // Get the authenticated user from WorkOS
    try {
        const { user } = await withAuth();

        if (user) {
            // Get or create user in Convex
            const convexUser = await convex.mutation(api.users.getOrCreateUser, {
                authProvider: "workos",
                authUserId: user.id,
                email: user.email || undefined,
            });

            // Check onboarding status
            if (convexUser && convexUser.onboardingStatus !== "complete") {
                // Redirect to onboarding
                return NextResponse.redirect(new URL("/onboarding", request.url));
            }

            // Get workspace ID for redirect
            if (convexUser?.lastWorkspaceId || convexUser?.defaultWorkspaceId) {
                const workspaceId = convexUser.lastWorkspaceId || convexUser.defaultWorkspaceId;
                return NextResponse.redirect(
                    new URL(`/workspaces/${workspaceId}/dashboard`, request.url)
                );
            }
        }
    } catch (error) {
        console.error("Error in auth callback:", error);
        // Fall through to default redirect
    }

    // Default: redirect to dashboard (will handle missing workspace there)
    return NextResponse.redirect(new URL("/dashboard", request.url));
}
