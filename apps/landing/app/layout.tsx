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
  title: "RecuperaVentas - Recupera ventas perdidas en WhatsApp",
  description: "Recupera ventas perdidas de WhatsApp con seguimiento automático."
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="es">
      <body className={`${sora.variable} antialiased`}>{children}</body>
    </html>
  );
}
