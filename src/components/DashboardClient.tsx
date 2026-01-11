"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ModalVenda } from '@/components/ModalVenda'

interface Props {
  lotes: any[]
  estoqueXarope: number
}

export function DashboardClient({ lotes, estoqueXarope }: Props) {
  const [isVendaOpen, setIsVendaOpen] = useState(false)
  
  const [indicadores, setIndicadores] = useState({
    faturamento: 0,
    garrafasVendidas: 0,
    garrafasProduzidas: 0
  })

  useEffect(() => {
    fetchIndicadores()
  }, [lotes])

  const fetchIndicadores = async () => {
    try {
        const totalProd750 = lotes.reduce((acc, l) => acc + (l.qtd_garrafas_750 || 0), 0)
        const totalProd375 = lotes.reduce((acc, l) => acc + (l.qtd_garrafas_375 || 0), 0)
        
        const { data: vendas } = await supabase.from('vendas').select('valor_total')
        const { data: itens } = await supabase.from('itens_venda').select('quantidade')

        const totalFaturado = vendas?.reduce((acc, v) => acc + (v.valor_total || 0), 0) || 0
        const totalVendidas = itens?.reduce((acc, i) => acc + (i.quantidade || 0), 0) || 0

        setIndicadores({
            faturamento: totalFaturado,
            garrafasVendidas: totalVendidas,
            garrafasProduzidas: totalProd750 + totalProd375
        })
    } catch (err) { console.error(err) }
  }

  const calcularEstoqueFisico = (tipo: string, tamanho: number) => {
    return lotes?.filter(
      l => l.produto?.toLowerCase() === tipo
    ).reduce((acc, l) => {
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
          <button onClick={() => setIsVendaOpen(true)} className="bg-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg text-sm flex items-center gap-2">
            <span>$ Nova Venda</span>
          </button>
          <Link href="/producao" className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-sm flex items-center gap-2">
            <span>+ Nova Produção</span>
          </Link>
        </div>
      </header>

      {/* INDICADORES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Total</span>
            <div className="text-3xl font-black text-green-600 tracking-tight">
                R$ {indicadores.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-green-50 w-fit px-2 py-1 rounded text-green-700">Receita Bruta</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendas Realizadas</span>
            <div className="text-3xl font-black text-purple-600 tracking-tight">
                {indicadores.garrafasVendidas} <span className="text-lg text-gray-400">un</span>
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-purple-50 w-fit px-2 py-1 rounded text-purple-700">Saída de Estoque</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produção Acumulada</span>
            <div className="text-3xl font-black text-blue-600 tracking-tight">
                {indicadores.garrafasProduzidas} <span className="text-lg text-gray-400">un</span>
            </div>
            <div className="text-[10px] text-gray-400 font-bold bg-blue-50 w-fit px-2 py-1 rounded text-blue-700">Total Engarrafado</div>
        </div>
      </section>

      {/* TANQUES */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Em Maturação (Tanques)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-lg">💧</div><span className="font-bold text-gray-600">Limoncello (Granel)</span></div>
              <div className="text-4xl font-black text-gray-900">{tanques.limoncello.toFixed(1)} <span className="text-lg text-gray-400 font-bold">Litros</span></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-lg">💧</div><span className="font-bold text-gray-600">Arancello (Granel)</span></div>
              <div className="text-4xl font-black text-gray-900">{tanques.arancello.toFixed(1)} <span className="text-lg text-gray-400 font-bold">Litros</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRATELEIRA (ESTOQUE ATUAL) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pronta Entrega (Estoque Atual)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Limoncello */}
          <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-yellow-900 mb-6 flex items-center gap-2">🍋 Limoncello</h3>
              <div className="space-y-2">
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center"><span className="text-xs font-bold text-yellow-600 uppercase">750ml</span><span className="text-2xl font-black text-gray-900">{stock.l750}</span></div>
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center"><span className="text-xs font-bold text-yellow-600 uppercase">375ml</span><span className="text-2xl font-black text-gray-900">{stock.l375}</span></div>
              </div>
            </div>
          </div>

          {/* Arancello */}
          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-orange-900 mb-6 flex items-center gap-2">🍊 Arancello</h3>
              <div className="space-y-2">
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center"><span className="text-xs font-bold text-orange-600 uppercase">750ml</span><span className="text-2xl font-black text-gray-900">{stock.a750}</span></div>
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center"><span className="text-xs font-bold text-orange-600 uppercase">375ml</span><span className="text-2xl font-black text-gray-900">{stock.a375}</span></div>
              </div>
            </div>
          </div>

          {/* Xarope */}
          <div className="bg-lime-50 p-8 rounded-3xl border border-lime-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-lime-900 mb-6 flex items-center gap-2">🍯 Xarope</h3>
              <div className="space-y-2">
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center h-[52px]">
                   <span className="text-xs font-bold text-lime-700 uppercase">Garrafa 1L</span>
                   <span className="text-2xl font-black text-gray-900">{estoqueXarope}</span>
                </div>
                <div className="bg-lime-100/50 p-3 rounded-xl flex justify-center items-center h-[52px]">
                   <span className="text-[10px] font-bold text-lime-800 uppercase">L. Siciliano</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <ModalVenda isOpen={isVendaOpen} onClose={() => { setIsVendaOpen(false); fetchIndicadores(); }} />
    </div>
  )
}