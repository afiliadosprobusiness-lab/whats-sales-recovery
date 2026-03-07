import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions
} from "@/lib/auth-token";
import { findUserByEmail, UserStoreError } from "@/lib/user-store";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
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
  } catch (error) {
    if (error instanceof UserStoreError) {
      console.error("Login failed in user-store", { code: error.code, error });

      if (error.code === "USER_STORE_NOT_WRITABLE") {
        return NextResponse.json(
          {
            error:
              "Login is temporarily unavailable due to server storage configuration."
          },
          { status: 503 }
        );
      }

      if (error.code === "USER_STORE_CORRUPTED") {
        return NextResponse.json(
          {
            error:
              "Login is temporarily unavailable due to invalid auth storage data."
          },
          { status: 500 }
        );
      }
    }

    console.error("Unexpected login error", error);
    return NextResponse.json(
      { error: "Unexpected server error during login." },
      { status: 500 }
    );
  }
}
