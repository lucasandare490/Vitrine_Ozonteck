import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LIBERA O DOMÍNIO DO CLOUDFLARE PARA O MODO DESENVOLVIMENTO
  allowedDevOrigins: [
    "appliances-red-nicholas-changed.trycloudflare.com",
  ],
  async headers() {
    return [
      {
        // Aplica esses cabeçalhos de segurança em TODAS as rotas do site
        source: "/(.*)",
        headers: [
          {
            // Força o navegador a usar HTTPS (Conexão Segura) e não HTTP
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Impede que hackers coloquem seu site dentro de um iframe falso (Clickjacking)
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Impede que o navegador "adivinhe" tipos de arquivos, bloqueando scripts disfarçados de imagens
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Controla o quanto de informação o seu site vaza quando um usuário clica em um link externo
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Bloqueia o acesso a recursos do dispositivo (câmera, microfone) para evitar espionagem
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;