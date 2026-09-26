import "./globals.css";
import { Inter } from "next/font/google";
import { obtenerSesion } from "@/lib/auth";
import Encabezado from "@/components/Encabezado";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "Asistencia QR",
  description: "Sistema de toma de asistencia por QR / código",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14161c" },
  ],
};

export default async function RootLayout({ children }) {
  const sesion = await obtenerSesion();

  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Encabezado sesion={sesion} />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
