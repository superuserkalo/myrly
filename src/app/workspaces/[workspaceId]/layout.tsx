import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface WorkspaceLayoutProps {
    children: React.ReactNode;
    params: Promise<{ workspaceId: string }>;
}

/**
 * Protected layout for all workspace routes.
 * Validates:
 * 1. User is authenticated
 * 2. Workspace exists
 * 3. User has access to the workspace (owner or member)
 */
export default async function WorkspaceLayout({
    children,
    params,
}: WorkspaceLayoutProps) {
    const { workspaceId } = await params;

    // 1. Require authentication - redirects to /sign-in if not logged in
    const session = await requireAuth(`/workspaces/${workspaceId}/dashboard`);

    // 2. Validate workspace ID format
    // Convex IDs are specific format - basic validation
    if (!workspaceId || workspaceId.length < 10) {
        notFound();
    }

    // 3. Check workspace access
    try {
        const accessResult = await convex.query(api.workspaces.checkAccess, {
            workspaceId: workspaceId as Id<"workspaces">,
            authProvider: "workos",
            authUserId: session.user.id,
        });

        if (!accessResult.hasAccess) {
            // Log for debugging (but don't expose to user)
            console.warn(
                `[WorkspaceLayout] Access denied for user ${session.user.id} to workspace ${workspaceId}: ${accessResult.reason}`
            );

            // Different handling based on reason
            if (accessResult.reason === "user_not_found") {
                // User exists in WorkOS but not in Convex - send to onboarding
                redirect("/onboarding");
            }

            if (accessResult.reason === "workspace_not_found") {
                notFound();
            }

            // no_access - user exists but doesn't have permission
            notFound();
        }

        // Access granted - render children
        return <>{children}</>;
    } catch (error) {
        // Handle invalid Convex ID format or other errors
        console.error("[WorkspaceLayout] Error checking access:", error);
        notFound();
    }
}
