import type { Metadata } from "next";
import { Inter } from "next/font/google"; // (Ou a fonte que estiver aí configurada)
import "./globals.css";

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
    // Adicione suppressHydrationWarning aqui nas duas tags principais
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}