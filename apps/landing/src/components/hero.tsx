import Link from "next/link";

export function Hero(): JSX.Element {
  return (
    <section className="section hero">
      <div className="section__content">
        <p className="eyebrow">RecuperaVentas</p>
        <h1 className="hero__title">
          Recupera clientes que te escribieron por WhatsApp pero no compraron.
        </h1>
        <p className="hero__subtitle">
          El sistema detecta conversaciones abandonadas y envía seguimiento
          automático para recuperar la venta.
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" href="/connect-whatsapp">
            Conectar mi WhatsApp
          </Link>
        </div>
      </div>

      <aside className="hero__visual" aria-hidden="true">
        <div className="signal signal--soft">Cliente: &quot;¿Precio?&quot;</div>
        <div className="signal signal--lost">Sin respuesta del cliente</div>
        <div className="signal signal--win">Seguimiento automático enviado</div>
      </aside>
    </section>
  );
}
