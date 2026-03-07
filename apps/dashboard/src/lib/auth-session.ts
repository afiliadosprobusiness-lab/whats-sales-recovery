import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  type AuthTokenPayload,
  verifyAuthToken
} from "@/lib/auth-token";

export function getAuthenticatedUser(): AuthTokenPayload | null {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export function requireAuthenticatedUser(): AuthTokenPayload {
  const user = getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function redirectIfAuthenticated(): void {
  const user = getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }
}
