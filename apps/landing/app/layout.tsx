import type { ReactNode } from "react";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata = {
  title: "RecuperaVentas",
  description: "Recupera ventas perdidas de WhatsApp con seguimiento automatico."
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="es">
      <body className={sora.variable}>{children}</body>
    </html>
  );
}
