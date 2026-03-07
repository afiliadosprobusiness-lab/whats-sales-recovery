import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getRecoveryBuckets } from "@/lib/saas-data";

export const dynamic = "force-dynamic";

function RecoveryTable({
  title,
  rows
}: {
  title: string;
  rows: Array<{
    id: string;
    phone: string;
    lastMessage: string;
    leadScore: number;
    recommendedAction: string;
  }>;
}): JSX.Element {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-3 py-2 font-medium">Customer phone</th>
              <th className="px-3 py-2 font-medium">Last message</th>
              <th className="px-3 py-2 font-medium">Lead score</th>
              <th className="px-3 py-2 font-medium">Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-none">
                <td className="px-3 py-2 text-slate-100">{row.phone}</td>
                <td className="px-3 py-2 text-slate-300">{row.lastMessage}</td>
                <td className="px-3 py-2 text-cyan-200">{row.leadScore}</td>
                <td className="px-3 py-2 text-slate-200">{row.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default async function RecoveryPage(): Promise<JSX.Element> {
  requireAuthenticatedUser();

  const data = await getRecoveryBuckets();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Recovery Panel</h2>
        <p className="mt-2 text-sm text-slate-300">
          Prioritize abandoned conversations and push next-best actions.
        </p>
      </header>

      <RecoveryTable
        title="Abandoned conversations"
        rows={data.abandonedConversations}
      />
      <RecoveryTable
        title="Reactivatable customers"
        rows={data.reactivatableCustomers}
      />
      <RecoveryTable title="Ready-to-close leads" rows={data.readyToCloseLeads} />
    </section>
  );
}
