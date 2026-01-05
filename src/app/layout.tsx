import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar"; // Importe o componente que acabamos de criar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raffinato ERP",
  description: "Controle de Produção e Estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gray-50 text-black`}>
        <div className="flex min-h-screen">
          
          {/* A Sidebar fica fixa na esquerda */}
          <Sidebar />

          {/* O conteúdo principal (suas páginas) fica na direita com uma margem de 16rem (256px) que é a largura da sidebar */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}