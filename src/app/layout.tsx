import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminLayout } from '@/components/AdminLayout' // Importa nosso novo gerente

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAFFINATO',
  description: 'Sistema de Gestão de Produção',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Removemos a <Sidebar> e o <main> antigos daqui.
           Agora o AdminLayout cuida de mostrar ou esconder.
        */}
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  )
}