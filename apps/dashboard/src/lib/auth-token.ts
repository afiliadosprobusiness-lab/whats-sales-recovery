import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "rv_auth_token";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const TOKEN_ALGORITHM = "HS256";
const TOKEN_TYPE = "JWT";
const DEFAULT_SECRET = "recuperaventas-local-dev-secret";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_SECRET;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(input: string): string {
  return createHmac("sha256", getJwtSecret())
    .update(input)
    .digest("base64url");
}

export function createAuthToken(input: {
  id: string;
  email: string;
  name: string;
}): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    sub: input.id,
    email: input.email,
    name: input.name,
    iat: issuedAt,
    exp: issuedAt + AUTH_COOKIE_MAX_AGE_SECONDS
  };

  const header = base64UrlEncode(
    JSON.stringify({ alg: TOKEN_ALGORITHM, typ: TOKEN_TYPE })
  );
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = sign(`${header}.${body}`);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!parsedPayload.sub || !parsedPayload.email || !parsedPayload.name) {
      return null;
    }

    if (parsedPayload.exp <= now) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
  };
}
