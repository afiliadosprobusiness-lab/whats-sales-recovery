import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="not-found">
      <h1>Página no encontrada</h1>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
