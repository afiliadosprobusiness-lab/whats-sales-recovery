import { ConnectWhatsappClient } from "./connect-whatsapp-client";
import { getApiBaseConfig } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function ConnectWhatsappPage(): JSX.Element {
  const config = getApiBaseConfig();

  if (!config.configured) {
    return (
      <section className="panel">
        <h1 className="page-title">Connect WhatsApp</h1>
        <p className="muted">
          Missing environment config. Set `NEXT_PUBLIC_API_BASE_URL` in
          `apps/dashboard/.env.local`.
        </p>
      </section>
    );
  }

  return <ConnectWhatsappClient />;
}
