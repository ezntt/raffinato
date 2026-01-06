"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Importa o cliente para fazer logout

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter() // Para redirecionar após sair
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
      ? "bg-yellow-50 text-yellow-700 border-r-4 border-yellow-500" 
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }

  const closeMenu = () => setIsOpen(false)

  // === FUNÇÃO DE LOGOUT ===
  const handleLogout = async () => {
    await supabase.auth.signOut() // Apaga o cookie
    router.push('/login') // Manda para a tela de login
    router.refresh() // Limpa o cache do navegador
  }

  return (
    <>
      {/* Botão Mobile */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-yellow-600"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
      `}>

        <div className="p-8 border-b border-gray-100">
          <h1 className="text-2xl font-black text-yellow-600 tracking-tight">raffinato 🍋</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de Produção</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <Link href="/" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Estoque
          </Link>
          <Link href="/lotes" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/lotes')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Lotes e Engarrafamento
          </Link>
          <Link href="/calculadora" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/calculadora')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="5" y1="5" y2="5"/><line x1="19" x2="5" y1="19" y2="19"/><circle cx="6.5" cy="12" r="2.5"/><line x1="21" x2="16" y1="12" y2="12"/></svg>
            Calculadora
          </Link>
          <Link href="/vendas" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/vendas')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Histórico de Vendas
          </Link>
          <Link href="/clientes" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/clientes')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Clientes
          </Link>
          <Link href="/insumos" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/insumos')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h12v4" />
              <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2 2 2 0 0 0 2 2h4v-4h-4z" />
            </svg>
            Insumos e Compras
          </Link>
          <Link 
            href="/configuracoes" 
            onClick={closeMenu} 
            className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/configuracoes')}`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Configurações
          </Link>
        </nav>

        {/* Rodapé da Sidebar COM LOGOUT */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
          
          {/* Info Usuário */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center font-bold text-yellow-700">R</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Raffinato</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>

          {/* Botão Sair */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50 p-2 rounded-lg transition-colors font-bold text-sm border border-transparent hover:border-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  )
}