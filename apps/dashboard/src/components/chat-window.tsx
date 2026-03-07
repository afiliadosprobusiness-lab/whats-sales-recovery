import type { ChatMessage } from "@/lib/saas-data";

type ChatWindowProps = {
  messages: ChatMessage[];
};

export function ChatWindow({ messages }: ChatWindowProps): JSX.Element {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
        Chat messages
      </h2>

      <div className="space-y-3">
        {messages.map((message) => (
          <article
            key={message.id}
            className={[
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm",
              message.direction === "outbound"
                ? "ml-auto rounded-tr-sm bg-cyan-500/20 text-cyan-100"
                : "rounded-tl-sm bg-white/[0.05] text-slate-100"
            ].join(" ")}
          >
            <p>{message.body}</p>
            <p className="mt-2 text-xs text-slate-400">{message.timestamp}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
