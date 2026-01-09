"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ModalVenda } from '@/components/ModalVenda'

interface Props {
  lotes: any[]
}

export function DashboardClient({ lotes }: Props) {
  const [isVendaOpen, setIsVendaOpen] = useState(false)
  
  // === ESTADO PARA OS INDICADORES ===
  const [indicadores, setIndicadores] = useState({
    faturamento: 0,
    garrafasVendidas: 0,
    garrafasProduzidas: 0
  })

  useEffect(() => {
    fetchIndicadores()
  }, [lotes]) // Recarrega se os lotes mudarem

  const fetchIndicadores = async () => {
    try {
        // 1. Produção Histórica (Soma o campo acumulador de todos os lotes)
        // Nota: qtd_garrafas_XXX é o seu "hodômetro" de produção
        const totalProd750 = lotes.reduce((acc, l) => acc + (l.qtd_garrafas_750 || 0), 0)
        const totalProd375 = lotes.reduce((acc, l) => acc + (l.qtd_garrafas_375 || 0), 0)
        
        // 2. Vendas (Soma direto das tabelas de venda)
        // Busca valor total de todas as vendas
        const { data: vendas } = await supabase.from('vendas').select('valor_total')
        // Busca quantidade total de itens vendidos
        const { data: itens } = await supabase.from('itens_venda').select('quantidade')

        const totalFaturado = vendas?.reduce((acc, v) => acc + (v.valor_total || 0), 0) || 0
        const totalVendidas = itens?.reduce((acc, i) => acc + (i.quantidade || 0), 0) || 0

        setIndicadores({
            faturamento: totalFaturado,
            garrafasVendidas: totalVendidas,
            garrafasProduzidas: totalProd750 + totalProd375
        })
    } catch (err) {
        console.error("Erro ao calcular indicadores:", err)
    }
  }

  // === CÁLCULOS DE ESTOQUE ATUAL (Disponível na prateleira) ===
  const calcularEstoqueFisico = (tipo: string, tamanho: number) => {
    return lotes?.filter(
      l => l.produto?.toLowerCase() === tipo
    ).reduce((acc, l) => {
      // Usa o campo estoque_XXX (que diminui com vendas)
      const qtdLote = tamanho === 750 ? (l.estoque_750 || 0) : (l.estoque_375 || 0)
      return acc + qtdLote
    }, 0) || 0
  }

  const stock = {
    l750: calcularEstoqueFisico('limoncello', 750),
    l375: calcularEstoqueFisico('limoncello', 375),
    a750: calcularEstoqueFisico('arancello', 750),
    a375: calcularEstoqueFisico('arancello', 375),
  }

  const tanques = {
    limoncello: lotes?.filter(l => l.produto === 'limoncello').reduce((acc, l) => acc + (l.volume_atual || 0), 0) || 0,
    arancello: lotes?.filter(l => l.produto === 'arancello').reduce((acc, l) => acc + (l.volume_atual || 0), 0) || 0
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 font-medium">Visão geral da operação</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsVendaOpen(true)}
            className="bg-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg text-sm flex items-center gap-2"
          >
            <span>$ Nova Venda</span>
          </button>

          <Link href="/producao" className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-sm flex items-center gap-2">
            <span>+ Nova Produção</span>
          </Link>
        </div>
      </header>

      {/* === SEÇÃO 1: INDICADORES DE PERFORMANCE (BI) === */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Total</span>
            <div className="text-3xl font-black text-green-600 tracking-tight">
                R$ {indicadores.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-green-50 w-fit px-2 py-1 rounded text-green-700">
                Receita Bruta
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendas Realizadas</span>
            <div className="text-3xl font-black text-purple-600 tracking-tight">
                {indicadores.garrafasVendidas} <span className="text-lg text-gray-400">un</span>
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-purple-50 w-fit px-2 py-1 rounded text-purple-700">
                Saída de Estoque
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produção Acumulada</span>
            <div className="text-3xl font-black text-blue-600 tracking-tight">
                {indicadores.garrafasProduzidas} <span className="text-lg text-gray-400">un</span>
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-blue-50 w-fit px-2 py-1 rounded text-blue-700">
                Total Engarrafado (Histórico)
            </div>
        </div>
      </section>

      {/* === SEÇÃO 2: TANQUES (MATURAÇÃO) === */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Em Maturação (Tanques)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* === SEÇÃO 3: PRATELEIRA (ESTOQUE ATUAL) === */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pronta Entrega (Estoque Atual)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Limoncello */}
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
                  <span className="text-xs text-gray-400 font-bold ml-1">disp.</span>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-yellow-600 uppercase mb-1">Pequena 375ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.l375}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">disp.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arancello */}
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
                  <span className="text-xs text-gray-400 font-bold ml-1">disp.</span>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl backdrop-blur-sm">
                  <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Pequena 375ml</span>
                  <span className="text-3xl font-black text-gray-900">{stock.a375}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">disp.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <ModalVenda 
        isOpen={isVendaOpen} 
        onClose={() => { 
            setIsVendaOpen(false)
            fetchIndicadores() // Atualiza os números ao fechar a venda
        }} 
      />
    </div>
  )
}