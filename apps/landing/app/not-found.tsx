import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="grid min-h-screen place-content-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-bold text-white">Página no encontrada</h1>
      <Link href="/" className="text-blue-300 transition-colors hover:text-blue-200">
        Volver al inicio
      </Link>
    </main>
  );
}
