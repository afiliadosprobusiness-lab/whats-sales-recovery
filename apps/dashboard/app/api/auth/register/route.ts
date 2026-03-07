import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions
} from "@/lib/auth-token";
import {
  createUser,
  findUserByEmail,
  UserStoreError
} from "@/lib/user-store";

type RegisterRequest = {
  name?: string;
  email?: string;
  password?: string;
};

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as RegisterRequest | null;

    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!name) {
      return badRequest("Name is required");
    }

    if (!email || !email.includes("@")) {
      return badRequest("Valid email is required");
    }

    if (password.length < 8) {
      return badRequest("Password must have at least 8 characters");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = await createUser({
      name,
      email,
      passwordHash
    });

    const token = createAuthToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return response;
  } catch (error) {
    if (error instanceof UserStoreError) {
      console.error("Register failed in user-store", { code: error.code, error });

      if (error.code === "EMAIL_IN_USE") {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      if (error.code === "USER_STORE_NOT_WRITABLE") {
        return NextResponse.json(
          {
            error:
              "Registration is temporarily unavailable due to server storage configuration."
          },
          { status: 503 }
        );
      }

      if (error.code === "USER_STORE_CORRUPTED") {
        return NextResponse.json(
          {
            error:
              "Registration is temporarily unavailable due to invalid auth storage data."
          },
          { status: 500 }
        );
      }
    }

    console.error("Unexpected register error", error);
    return NextResponse.json(
      { error: "Unexpected server error during registration." },
      { status: 500 }
    );
  }
}
