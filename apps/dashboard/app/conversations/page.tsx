import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getConversationsCRM } from "@/lib/saas-data";
import { ConversationsCrmClient } from "./conversations-crm-client";

export const dynamic = "force-dynamic";

export default async function ConversationsPage(): Promise<JSX.Element> {
  requireAuthenticatedUser();

  const conversations = await getConversationsCRM();

  return <ConversationsCrmClient conversations={conversations} />;
}
