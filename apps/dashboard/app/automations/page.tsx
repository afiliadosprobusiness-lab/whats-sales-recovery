import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getApiBaseConfig } from "@/lib/api";
import { AutomationsClient } from "./automations-client";

export const dynamic = "force-dynamic";

export default function AutomationsPage(): JSX.Element {
  requireAuthenticatedUser();

  const config = getApiBaseConfig();
  if (!config.configured) {
    return (
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
        <h2 className="text-2xl font-semibold text-white">Automations</h2>
        <p className="mt-3 text-sm text-amber-100">
          Missing API configuration. Add `NEXT_PUBLIC_API_BASE_URL` to
          `apps/dashboard/.env.local`.
        </p>
      </section>
    );
  }

  return <AutomationsClient />;
}
