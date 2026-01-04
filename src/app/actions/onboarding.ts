"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE = "__session";
const REFRESH_COOKIE = "__refresh";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type HeaderStore = Awaited<ReturnType<typeof headers>>;

type ClerkCookie = {
  name: string;
  value: string;
  suffixed: boolean;
};

const resolveAppOrigin = () => {
  const override =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL;
  if (override) {
    return override.replace(/\/$/, "");
  }
  const vercelUrl =
    process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
};

const findClerkCookie = (
  cookieStore: CookieStore,
  baseName: string,
): ClerkCookie | null => {
  const direct = cookieStore.get(baseName);
  if (direct?.value) {
    return { name: baseName, value: direct.value, suffixed: false };
  }
  const prefixed = cookieStore
    .getAll()
    .find((cookie) => cookie.name.startsWith(`${baseName}_`));
  if (!prefixed?.value) {
    return null;
  }
  return { name: prefixed.name, value: prefixed.value, suffixed: true };
};

const parseSetCookie = (cookieString: string) => {
  const parts = cookieString.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  if (!nameValue) {
    return null;
  }
  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }
  const name = nameValue.slice(0, separatorIndex).trim();
  const value = nameValue.slice(separatorIndex + 1);
  const options: {
    domain?: string;
    path?: string;
    maxAge?: number;
    expires?: Date;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    httpOnly?: boolean;
  } = {};

  for (const attribute of attributes) {
    if (!attribute) {
      continue;
    }
    const [rawKey, ...rawValueParts] = attribute.split("=");
    const key = rawKey.trim().toLowerCase();
    const rawValue = rawValueParts.join("=").trim();
    switch (key) {
      case "domain":
        if (rawValue) {
          options.domain = rawValue;
        }
        break;
      case "path":
        options.path = rawValue || "/";
        break;
      case "max-age": {
        const maxAge = Number(rawValue);
        if (!Number.isNaN(maxAge)) {
          options.maxAge = maxAge;
        }
        break;
      }
      case "expires": {
        const expires = new Date(rawValue);
        if (!Number.isNaN(expires.getTime())) {
          options.expires = expires;
        }
        break;
      }
      case "samesite": {
        const sameSite = rawValue.toLowerCase();
        if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
          options.sameSite = sameSite;
        }
        break;
      }
      case "secure":
        options.secure = true;
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      default:
        break;
    }
  }

  return { name, value, options };
};

const applySetCookies = (
  cookieStore: CookieStore,
  cookieStrings: string[],
) => {
  for (const cookieString of cookieStrings) {
    const parsed = parseSetCookie(cookieString);
    if (!parsed) {
      continue;
    }
    cookieStore.set(parsed.name, parsed.value, parsed.options);
  }
};

const setSessionCookie = (cookieStore: CookieStore, name: string, value: string) => {
  cookieStore.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

const getClerkCookieSuffix = (cookieStore: CookieStore) => {
  const bases = ["__session", "__refresh", "__client_uat"];
  const cookies = cookieStore.getAll();
  for (const base of bases) {
    const match = cookies.find((cookie) => cookie.name.startsWith(`${base}_`));
    if (match) {
      return match.name.slice(base.length + 1);
    }
  }
  return null;
};

const buildRequestOrigin = (headerStore: HeaderStore) => {
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const rawHost = forwardedHost ?? headerStore.get("host");
  const host = rawHost?.split(",")[0]?.trim();
  if (!host) {
    return resolveAppOrigin();
  }
  const protocol =
    forwardedProto?.split(",")[0]?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${protocol}://${host}`;
};

const buildRequestHeaders = (headerStore: HeaderStore) => {
  const requestHeaders: Record<string, string[]> = {};
  for (const [key, value] of headerStore.entries()) {
    requestHeaders[key] = [value];
  }
  return requestHeaders;
};

export async function completeOnboarding(formData: FormData) {
  const { userId, sessionId } = await auth();

  if (!userId || !sessionId) {
    return { message: "No user found" };
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const client = await clerkClient();

  const studioName = String(formData.get("studio_name") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const trialChoice = String(formData.get("trial_choice") ?? "").trim();
  const rawStyles = String(formData.get("styles") ?? "");
  const rawInvites = String(formData.get("team_invites") ?? "");
  let styles: string[] = [];
  let teamInvites: string[] = [];
  try {
    styles = JSON.parse(rawStyles) as string[];
  } catch {
    styles = [];
  }
  try {
    teamInvites = JSON.parse(rawInvites) as string[];
  } catch {
    teamInvites = [];
  }

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboarding_complete: true,
        studio_name: studioName || undefined,
        onboarding_intent: intent || undefined,
        onboarding_styles: styles.length ? styles : undefined,
        trial_choice: trialChoice || undefined,
        team_invite_count: teamInvites.length || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to update user metadata", error);
    return { message: "Failed to update profile" };
  }

  try {
    const sessionCookie = findClerkCookie(cookieStore, SESSION_COOKIE);
    const refreshCookie = findClerkCookie(cookieStore, REFRESH_COOKIE);
    const cookieSuffix = getClerkCookieSuffix(cookieStore);
    const sessionCookieName =
      sessionCookie?.name ??
      (cookieSuffix ? `${SESSION_COOKIE}_${cookieSuffix}` : SESSION_COOKIE);

    if (refreshCookie && sessionCookie) {
      const requestHeaders = buildRequestHeaders(headerStore);
      const requestOriginatingIp =
        requestHeaders["x-forwarded-for"]?.[0]?.split(",")[0]?.trim() ||
        requestHeaders["x-real-ip"]?.[0];
      const refreshed = await client.sessions.refreshSession(sessionId, {
        expired_token: sessionCookie.value,
        refresh_token: refreshCookie.value,
        request_origin: buildRequestOrigin(headerStore),
        request_originating_ip: requestOriginatingIp || undefined,
        request_headers: requestHeaders,
        suffixed_cookies: sessionCookie.suffixed || refreshCookie.suffixed,
        format: "cookie",
      });
      applySetCookies(cookieStore, refreshed.cookies);
    } else {
      const token = await client.sessions.getToken(sessionId);
      setSessionCookie(cookieStore, sessionCookieName, token.jwt);
    }
  } catch (error) {
    console.error("Failed to refresh session", error);
    return { message: "Failed to refresh session. Please try again." };
  }

  return { success: true };
}
