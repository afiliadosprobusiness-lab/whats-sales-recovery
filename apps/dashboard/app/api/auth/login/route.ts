import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions
} from "@/lib/auth-token";
import { findUserByEmail } from "@/lib/user-store";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as LoginRequest | null;

  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordValid = await compare(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createAuthToken({
    id: user.id,
    email: user.email,
    name: user.name
  });

  const response = NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
