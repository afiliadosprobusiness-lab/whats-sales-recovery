import Link from "next/link";

export default function NotFoundPage(): JSX.Element {
  return (
    <section className="panel">
      <h1 className="page-title">Conversation not found</h1>
      <p className="muted">
        The requested conversation does not exist in the configured workspace.
      </p>
      <p className="muted">
        <Link href="/conversations">Back to conversations</Link>
      </p>
    </section>
  );
}
