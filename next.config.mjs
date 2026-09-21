/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Evita que Next.js reutilice en el navegador una versión vieja
    // de páginas dinámicas al navegar hacia atrás.
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;
