import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Require authentication to access dashboard
    await requireAuth("/dashboard");

    return <>{children}</>;
}
