"use client"
import { useState } from 'react'
import Link from 'next/link'
import { ModalVenda } from '@/components/ModalVenda'

interface Props {
  estoqueGarrafas: any[]
  lotes: any[]
}

export function DashboardClient({ estoqueGarrafas, lotes }: Props) {
  const [isVendaOpen, setIsVendaOpen] = useState(false)

  // === CÁLCULOS ===
  const getGarrafas = (tipo: string, tam: number) => {
    const item = estoqueGarrafas?.find(e => e.tipo?.toLowerCase() === tipo && e.tamanho === tam)
    return item?.quantidade || 0
  }

  const stock = {
    l750: getGarrafas('limoncello', 750),
    l375: getGarrafas('limoncello', 375),
    a750: getGarrafas('arancello', 750),
    a375: getGarrafas('arancello', 375),
  }

  const tanques = {
    limoncello: lotes?.filter(l => l.produto === 'limoncello').reduce((acc, l) => acc + l.volume_atual, 0) || 0,
    arancello: lotes?.filter(l => l.produto === 'arancello').reduce((acc, l) => acc + l.volume_atual, 0) || 0
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel Central & Estoque</h1>
        </div>
        <div className="flex gap-3">
           {/* BOTÃO NOVA VENDA VOLTOU AQUI */}
           <button 
             onClick={() => setIsVendaOpen(true)}
             className="bg-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg text-sm flex items-center gap-2"
           >
             <span>💰 Nova Venda</span>
           </button>

           <Link href="/calculadora" className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-sm flex items-center gap-2">
             <span>+ Novo Lote</span>
           </Link>
        </div>
      </header>

      {/* === SEÇÃO 1: TANQUES (LITROS) === */}
      <section className="mb-12">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Em Maturação (Tanques)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tanque Limoncello */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">🍋</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-lg">💧</div>
                <span className="font-bold text-gray-600">Limoncello (Granel)</span>
              </div>
              <div className="text-4xl font-black text-gray-900">
                {tanques.limoncello.toFixed(1)} <span className="text-lg text-gray-400 font-bold">Litros</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Equivale a aprox. <b>{Math.floor(tanques.limoncello / 0.75)}</b> garrafas (750ml)
              </p>
            </div>
          </div>

          {/* Tanque Arancello */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl">🍊</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-lg">💧</div>
                <span className="font-bold text-gray-600">Arancello (Granel)</span>
              </div>
              <div className="text-4xl font-black text-gray-900">
                {tanques.arancello.toFixed(1)} <span className="text-lg text-gray-400 font-bold">Litros</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Equivale a aprox. <b>{Math.floor(tanques.arancello / 0.75)}</b> garrafas (750ml)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === SEÇÃO 2: PRATELEIRA (GARRAFAS) === */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pronta Entrega (Garrafas)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Limoncello */}
          <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-yellow-200 rounded-full opacity-50 blur-2xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black text-yellow-900 mb-6 flex items-center gap-2">
                🍋 Limoncello
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-yellow-600 uppercase mb-1">Garrafa 750ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.l750}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">un</span>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-yellow-600 uppercase mb-1">Pequena 375ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.l375}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">un</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Arancello */}
          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-orange-200 rounded-full opacity-50 blur-2xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black text-orange-900 mb-6 flex items-center gap-2">
                🍊 Arancello
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Garrafa 750ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.a750}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">un</span>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Pequena 375ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.a375}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">un</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* O Modal de Venda fica aqui, controlado pelo botão */}
      <ModalVenda isOpen={isVendaOpen} onClose={() => setIsVendaOpen(false)} />

    </div>
  )
}