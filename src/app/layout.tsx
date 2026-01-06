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

          {/* 1. ml-0: Margem zero no celular (conteúdo ocupa a tela toda)
            2. md:ml-64: Margem de 256px só no PC (para a sidebar) 
            3. Removi o 'p-8' daqui para não somar com o padding das páginas
          */}
          
          <main className="flex-1 ml-0 md:ml-64 transition-all duration-300 bg-gray-50 min-h-screen">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}