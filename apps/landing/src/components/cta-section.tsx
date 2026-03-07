import Link from "next/link";

export function CTASection(): JSX.Element {
  return (
    <section className="section final-cta">
      <div className="section__content">
        <h2 className="section__title">Empieza a recuperar ventas hoy</h2>
        <p className="section__subtitle">
          Activa tu flujo en minutos y recupera clientes que ya mostraron
          intención de compra.
        </p>
        <Link className="button button--primary" href="/connect-whatsapp">
          Conectar mi WhatsApp
        </Link>
      </div>
    </section>
  );
}
