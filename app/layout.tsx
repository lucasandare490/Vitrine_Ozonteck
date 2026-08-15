import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Importando a nossa nova barra global e o seu carrinho flutuante
import Navbar from "@/components/Navbar";
import FloatingCart from "@/components/FloatingCart";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ozonteck | Vitrine Digital",
  description: "Os melhores produtos ozonizados e com nanotecnologia do mundo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        
        {/* A Navbar vai aparecer no topo de TODAS as páginas */}
        <Navbar />
        
        {/* Aqui é onde o conteúdo de cada página (Home, Lista, etc) é injetado */}
        {children}

        {/* O Carrinho fica flutuando globalmente */}
        <FloatingCart />
        
      </body>
    </html>
  );
}