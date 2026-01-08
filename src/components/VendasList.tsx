"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export function VendasList({ initialVendas }: { initialVendas: any[] }) {
  const [vendas, setVendas] = useState(initialVendas)
  const [filtro, setFiltro] = useState<'todos' | 'pagos' | 'pendentes'>('todos')

  // === CÁLCULOS DINÂMICOS (Agora atualizam na hora!) ===
  const faturamentoTotal = vendas.reduce((acc, venda) => acc + venda.valor_total, 0)
  
  const totalPendente = vendas
    .filter(v => !v.pago)
    .reduce((acc, venda) => acc + venda.valor_total, 0)

  // Filtra a lista para exibição
  const vendasFiltradas = vendas.filter(v => {
    if (filtro === 'pagos') return v.pago === true
    if (filtro === 'pendentes') return v.pago === false
    return true
  })

  // Função para mudar status
  const togglePagamento = async (id: number, statusAtual: boolean) => {
    // 1. Atualização Otimista
    const novosDados = vendas.map(v => v.id === id ? { ...v, pago: !statusAtual } : v)
    setVendas(novosDados)

    // 2. Salva no Banco
    const { error } = await supabase
      .from('vendas')
      .update({ pago: !statusAtual })
      .eq('id', id)

    if (error) {
      alert("Erro ao atualizar pagamento!")
      setVendas(vendas) // Reverte se der erro
    }
  }

  return (
    <div className="space-y-6">
      
      {/* === CABEÇALHO COM TOTAIS DINÂMICOS === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Histórico de Vendas</h1>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          {/* Cards... */}
          <div className="flex-1 md:flex-none bg-red-50 px-6 py-4 rounded-2xl border border-red-100 text-right">
            <span className="text-xs uppercase font-bold text-red-400 block">A Receber</span>
            <span className="text-xl font-black text-red-900">R$ {totalPendente.toFixed(2)}</span>
          </div>
          <div className="flex-1 md:flex-none bg-green-50 px-6 py-4 rounded-2xl border border-green-100 text-right">
            <span className="text-xs uppercase font-bold text-green-600 block">Faturamento</span>
            <span className="text-3xl font-black text-green-900">R$ {faturamentoTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* === BARRA DE FILTROS === */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'todos' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Todos</button>
        <button onClick={() => setFiltro('pagos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'pagos' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-green-600'}`}>Pagos</button>
        <button onClick={() => setFiltro('pendentes')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'pendentes' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-red-500'}`}>Pendentes</button>
      </div>

      {/* === LISTA === */}
      <div className="space-y-3">
        {vendasFiltradas.length === 0 && <p className="text-gray-400 font-medium py-8">Nenhuma venda encontrada.</p>}

        {vendasFiltradas.map((venda) => (
          <div key={venda.id} className="flex flex-col md:flex-row bg-white p-6 rounded-2xl border border-gray-100 hover:border-black transition-all gap-4 md:items-center">
            
            <Link href={`/vendas/${venda.id}`} className="flex-1 flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">#{venda.id}</div>
              <div>
                {/* Aqui usamos venda.Cliente?.nome (Maiúsculo) */}
                <h2 className="font-bold text-lg text-gray-900">{venda.Cliente?.nome || 'Cliente Desconhecido'}</h2>
                <div className="flex gap-2 text-xs font-bold uppercase mt-1">
                  <span className="text-gray-400">{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                  {venda.pago ? <span className="text-green-600 bg-green-50 px-2 rounded">Pago</span> : <span className="text-red-500 bg-red-50 px-2 rounded">Pendente</span>}
                </div>
              </div>
            </Link>
            
            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 w-full md:w-auto">
              <div className="text-left md:text-right">
                <span className="block text-xl font-black text-gray-900">R$ {venda.valor_total.toFixed(2)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); togglePagamento(venda.id, venda.pago) }}
                className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${venda.pago ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-red-200 text-red-500 hover:bg-red-50'}`}
              >
                {venda.pago ? <>✓ Pago</> : <>Marcar Pago</>}
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}