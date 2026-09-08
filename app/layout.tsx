import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import Navbar from "@/components/Navbar";
import FloatingCart from "@/components/FloatingCart";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ozonteck | Loja Virtual Recife", // Mudança de Posicionamento aqui
  description: "A sua loja oficial de produtos ozonizados e nanotecnologia. A mesma experiência da loja física, agora online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
        {children}
        <FloatingCart />
        
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#334155',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              borderRadius: '100px'
            },
            success: { style: { background: '#0D9488' } },
            error: { style: { background: '#E11D48' } },
          }} 
        />
      </body>
    </html>
  );
}