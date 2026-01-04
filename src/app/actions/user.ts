"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export async function deleteUserAccount() {
  const { userId, sessionId } = await auth();

  if (!userId || !sessionId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();

  try {
    await client.sessions.revokeSession(sessionId);
  } catch (error) {
    console.error("Failed to revoke session", error);
  }

  await client.users.deleteUser(userId);

  const cookieStore = await cookies();
  const clerkCookiePrefixes = [
    "__session",
    "__refresh",
    "__client_uat",
    "__clerk",
    "__dev_session",
  ];

  for (const cookie of cookieStore.getAll()) {
    if (
      clerkCookiePrefixes.some(
        (prefix) =>
          cookie.name === prefix ||
          cookie.name.startsWith(`${prefix}_`) ||
          cookie.name.startsWith(prefix),
      )
    ) {
      cookieStore.delete(cookie.name);
    }
  }

  return { success: true };
}
