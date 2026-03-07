import { Instagram, Linkedin, Mail, MessageCircle, Twitter } from "lucide-react";
import Link from "next/link";

const productLinks = ["Caracteristicas", "Precios", "Integraciones", "API"];
const resourceLinks = ["Blog", "Ayuda", "Comunidad", "Contacto"];

export function Footer(): JSX.Element {
  return (
    <footer className="relative border-t border-white/10 px-4 py-16 sm:px-6">
      <div className="container">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-600 shadow-lg shadow-purple-500/50">
                <MessageCircle className="h-6 w-6 text-white" />
              </span>
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-xl font-bold text-transparent">
                RecuperaVentas
              </span>
            </Link>
            <p className="mb-6 max-w-sm text-foreground/60">
              La plataforma inteligente que recupera automaticamente tus ventas perdidas en WhatsApp.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Instagram, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="ui-card flex h-10 w-10 items-center justify-center rounded-lg border-white/10 p-0 hover:scale-110"
                >
                  <Icon className="h-5 w-5 text-foreground/60" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Producto</h4>
            <ul className="space-y-3">
              {productLinks.map((label) => (
                <li key={label}>
                  <a href="#" className="text-foreground/60 ui-link-hover">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Recursos</h4>
            <ul className="space-y-3">
              {resourceLinks.map((label) => (
                <li key={label}>
                  <a href="#" className="text-foreground/60 ui-link-hover">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-foreground/60">© 2026 RecuperaVentas. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6 text-sm text-foreground/60">
            <a href="#" className="ui-link-hover">
              Privacidad
            </a>
            <a href="#" className="ui-link-hover">
              Terminos
            </a>
            <a href="#" className="ui-link-hover">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
