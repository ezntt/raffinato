"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ModalAlerta } from './ModalAlerta'
import type { AlertType } from '@/types'

export function VendasList({ initialVendas }: { initialVendas: any[] }) {
  const [vendas, setVendas] = useState(initialVendas)
  const [filtro, setFiltro] = useState<'todos' | 'pagos' | 'pendentes'>('todos')
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  
  // NOVOS ESTADOS DE FILTRO
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)) // Ex: 2024-02
  const [busca, setBusca] = useState('')

  // Filtra a lista
  const vendasFiltradas = vendas.filter(v => {
    // 1. Filtro de Mês
    if (filtroMes && !v.data_venda.startsWith(filtroMes)) return false

    // 2. Filtro de Status
    if (filtro === 'pagos' && !v.pago) return false
    if (filtro === 'pendentes' && v.pago) return false

    // 3. Busca por Nome ou ID
    if (busca) {
        const termo = busca.toLowerCase()
        const nomeCliente = v.Cliente?.nome?.toLowerCase() || ''
        const idVenda = v.id.toString()
        if (!nomeCliente.includes(termo) && !idVenda.includes(termo)) return false
    }

    return true
  })

  // === CÁLCULOS DINÂMICOS ===
  const faturamentoTotal = vendasFiltradas
    .filter(v => v.pago)
    .reduce((acc, venda) => acc + venda.valor_total, 0)
  
  const totalPendente = vendasFiltradas
    .filter(v => !v.pago)
    .reduce((acc, venda) => acc + venda.valor_total, 0)

  // Função para mudar status
  const togglePagamento = async (id: number, statusAtual: boolean) => {
    const novosDados = vendas.map(v => v.id === id ? { ...v, pago: !statusAtual } : v)
    setVendas(novosDados)

    const { error } = await supabase
      .from('vendas')
      .update({ pago: !statusAtual })
      .eq('id', id)

    if (error) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao atualizar pagamento!', type: 'error' })
      setVendas(vendas)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* === CABEÇALHO COM TOTAIS DINÂMICOS DO FILTRO === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Histórico de Vendas</h1>
          <p className="text-gray-400 font-bold text-xs mt-1 uppercase">
            Exibindo {vendasFiltradas.length} vendas em {filtroMes || 'todo o período'}
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-red-50 px-6 py-4 rounded-2xl border border-red-100 text-right">
            <span className="text-xs uppercase font-bold text-red-400 block">Pendente (Mês)</span>
            <span className="text-3xl font-black text-red-900">R$ {totalPendente.toFixed(2)}</span>
          </div>
          <div className="flex-1 md:flex-none bg-green-50 px-6 py-4 rounded-2xl border border-green-100 text-right">
            <span className="text-xs uppercase font-bold text-green-600 block">Faturamento (Mês)</span>
            <span className="text-3xl font-black text-green-900">R$ {faturamentoTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* === BARRA DE FILTROS E BUSCA === */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        
        {/* Filtro Mês */}
        <div className="flex-none">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Mês de Referência (yyyy-mm)</label>
                {filtroMes && (
                    <button 
                        onClick={() => setFiltroMes('')}
                        className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                    >
                        Ver tudo
                    </button>
                )}
            </div>
            <input 
                type="month" 
                value={filtroMes} 
                onChange={e => setFiltroMes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900 outline-none focus:border-black "
            />
        </div>

        {/* Busca */}
        <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Buscar Venda</label>
            <input 
                type="text" 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Nome do Cliente ou ID..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900 outline-none focus:border-black"
            />
        </div>

        {/* Filtro Status (Abas) */}
        <div className="flex-none">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
            <div className="flex bg-gray-100 p-1 rounded-xl h-11.5">
                <button onClick={() => setFiltro('todos')} className={`px-4  rounded-lg text-sm font-bold transition-all ${filtro === 'todos' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Todos</button>
                <button onClick={() => setFiltro('pagos')} className={`px-4  rounded-lg text-sm font-bold transition-all ${filtro === 'pagos' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-green-600'}`}>Pagos</button>
                <button onClick={() => setFiltro('pendentes')} className={`px-4  rounded-lg text-sm font-bold transition-all ${filtro === 'pendentes' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-red-500'}`}>Pendentes</button>
            </div>
        </div>
      </div>

      {/* === LISTA === */}
      <div className="space-y-3">
        {vendasFiltradas.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <p className="text-gray-400 font-bold">Nenhuma venda encontrada para os filtros atuais.</p>
                <p className="text-xs text-gray-300 mt-2">Tente mudar o mês ou limpar a busca.</p>
            </div>
        )}

        {vendasFiltradas.map((venda) => (
          <div key={venda.id} className="flex flex-col md:flex-row bg-white p-6 rounded-2xl border border-gray-100 hover:border-black transition-all gap-4 md:items-center">
            
            <Link href={`/vendas/${venda.id}`} className="flex-1 flex items-center gap-4 group ">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">#{venda.id}</div>
              <div>
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
                className={`flex items-center gap-2  px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${venda.pago ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-red-200 text-red-500 hover:bg-red-50'}`}
              >
                {venda.pago ? <>✓ Pago</> : <>Marcar Pago</>}
              </button>
            </div>

          </div>
        ))}
      </div>

      <ModalAlerta
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        type={alerta.type}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  )
}