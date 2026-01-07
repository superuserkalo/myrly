import { requireAuth } from "@/lib/auth";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Require authentication to access onboarding
    await requireAuth("/onboarding");

    return <>{children}</>;
}
