import { AuthForm } from "@/components/auth-form";
import { redirectIfAuthenticated } from "@/lib/auth-session";

export default function RegisterPage(): JSX.Element {
  redirectIfAuthenticated();

  return <AuthForm mode="register" />;
}
