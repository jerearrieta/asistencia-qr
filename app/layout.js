import "./globals.css";

export const metadata = {
  title: "Asistencia QR",
  description: "Sistema de toma de asistencia por QR / código",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
