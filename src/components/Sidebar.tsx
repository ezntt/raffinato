"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false) // Estado para controlar menu no celular

  // Função auxiliar para verificar link ativo
  const isActive = (path: string) => {
    // Verifica se é a página exata OU se é uma sub-página (ex: vendas/123)
    return pathname === path || pathname.startsWith(`${path}/`)
      ? "bg-yellow-50 text-yellow-700 border-r-4 border-yellow-500" 
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  }

  // Função para fechar o menu ao clicar em um link (melhora UX no celular)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* === BOTÃO DE MENU MOBILE (Só aparece em telas pequenas) === */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-yellow-600"
      >
        {isOpen ? (
          // Ícone X (Fechar)
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          // Ícone Hambúrguer (Abrir)
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      {/* === FUNDO ESCURO (OVERLAY) NO MOBILE === */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* === SIDEBAR PRINCIPAL === */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
      `}>

        {/* Logo / Cabeçalho */}
        <div className="p-8 border-b border-gray-100">
          <h1 className="text-2xl font-black text-yellow-600 tracking-tight">raffinato 🍋</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de Produção</p>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          
          <Link href="/" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Estoque
          </Link>

          {/* === NOVO LINK ADICIONADO AQUI === */}
          <Link href="/vendas" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/vendas')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Histórico de Vendas
          </Link>
          {/* ================================= */}

          <Link href="/lotes" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/lotes')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Lotes em Produção
          </Link>

          <Link href="/calculadora" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/calculadora')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="5" y1="5" y2="5"/><line x1="19" x2="5" y1="19" y2="19"/><circle cx="6.5" cy="12" r="2.5"/><line x1="21" x2="16" y1="12" y2="12"/></svg>
            Calculadora
          </Link>

          <Link href="/clientes" onClick={closeMenu} className={`px-8 py-4 flex items-center gap-3 font-bold transition-all ${isActive('/clientes')}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Clientes
          </Link>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center font-bold text-yellow-700">
              R
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Raffinato</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}