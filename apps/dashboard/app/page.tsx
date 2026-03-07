import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-session";

export default function HomePage(): never {
  const user = getAuthenticatedUser();

  if (user) {
    redirect("/connect-whatsapp");
  }

  redirect("/register");
}
