"use client"
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Verifica se estamos na página de login
  const isLoginPage = pathname === '/login'

  // CENÁRIO 1: É Login? Retorna limpo (sem sidebar, sem margem extra)
  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>
  }

  // CENÁRIO 2: É o Sistema? Retorna com Sidebar e Margem
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* A margem md:ml-64 só existe aqui agora */}
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}