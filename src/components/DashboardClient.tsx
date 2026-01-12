"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ModalVenda } from '@/components/ModalVenda'

interface Props {
  lotes: any[]
  estoque: any[]
}

export function DashboardClient({ lotes, estoque }: Props) {
  const [isVendaOpen, setIsVendaOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<{ produto: string, tamanho: number, itens: any[] } | null>(null)

  const [indicadores, setIndicadores] = useState({
    faturamento: 0,
    garrafasVendidas: 0,
    producao: { total: 0, limoncello750: 0, limoncello375: 0, arancello750: 0, arancello375: 0 },
    vendas: { total: 0, limoncello750: 0, limoncello375: 0, arancello750: 0, arancello375: 0 }
  })

  useEffect(() => {
    fetchIndicadores()
  }, [lotes])

  const fetchIndicadores = async () => {
    try {
        // 1. Produção (Baseado nos Lotes - Mantido local pois 'lotes' já vem na prop)
        let p_l750 = 0, p_l375 = 0, p_a750 = 0, p_a375 = 0
        lotes.forEach(l => {
          if (l.produto === 'limoncello') { p_l750 += (l.qtd_garrafas_750 || 0); p_l375 += (l.qtd_garrafas_375 || 0) } 
          else if (l.produto === 'arancello') { p_a750 += (l.qtd_garrafas_750 || 0); p_a375 += (l.qtd_garrafas_375 || 0) }
        })
        const prodTotal = p_l750 + p_l375 + p_a750 + p_a375
        
        // 2. Vendas (AGORA VIA RPC - MUITO MAIS RÁPIDO)
        const { data: stats, error } = await supabase.rpc('get_vendas_stats')
        
        if (error) throw error

        // O RPC retorna um JSON, vamos parsear
        const detalhe = stats.detalhe || {}
        const v_l750 = Number(detalhe['limoncello_750'] || 0)
        const v_l375 = Number(detalhe['limoncello_375'] || 0)
        const v_a750 = Number(detalhe['arancello_750'] || 0)
        const v_a375 = Number(detalhe['arancello_375'] || 0)

        setIndicadores({
            faturamento: Number(stats.faturamento || 0),
            garrafasVendidas: Number(stats.garrafasVendidas || 0),
            producao: { total: prodTotal, limoncello750: p_l750, limoncello375: p_l375, arancello750: p_a750, arancello375: p_a375 },
            vendas: { total: Number(stats.garrafasVendidas || 0), limoncello750: v_l750, limoncello375: v_l375, arancello750: v_a750, arancello375: v_a375 }
        })
    } catch (err) { console.error(err) }
  }

  // ... (Resto do código getQtd, abrirDetalhes, StockRow e JSX igual ao anterior) ...
  const getQtd = (slug: string) => {
    const item = estoque.find(i => i.slug === slug)
    return item ? item.quantidade : 0
  }

  const abrirDetalhes = (produto: string, tamanho: number) => {
    const lotesComEstoque = lotes.filter(l => {
        const qtdLote = tamanho === 750 ? l.estoque_750 : l.estoque_375
        return l.produto === produto && qtdLote > 0
    }).map(l => ({ id: l.id, qtd: tamanho === 750 ? l.estoque_750 : l.estoque_375, data: l.created_at }))
    setDetailData({ produto, tamanho, itens: lotesComEstoque })
    setDetailOpen(true)
  }

  const StockRow = ({ produto, tamanho, colorText }: { produto: string, tamanho: number, colorText: string }) => {
    const qtdTotal = getQtd(`${produto}_${tamanho}`)
    const countLotes = lotes.filter(l => {
        const qtd = tamanho === 750 ? l.estoque_750 : l.estoque_375
        return l.produto === produto && qtd > 0
    }).length
    return (
        <div onClick={() => abrirDetalhes(produto, tamanho)} className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-white transition-all group">
            <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase ${colorText}`}>{tamanho}ml</span>
                {countLotes > 0 && (<span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600">{countLotes} {countLotes === 1 ? 'lote' : 'lotes'}</span>)}
            </div>
            <span className="text-2xl font-black text-gray-900 group-hover:scale-110 transition-transform">{qtdTotal}</span>
        </div>
    )
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
          <button onClick={() => setIsVendaOpen(true)} className="bg-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg text-sm flex items-center gap-2"><span>$ Nova Venda</span></button>
          <Link href="/producao" className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-sm flex items-center gap-2"><span>+ Nova Produção</span></Link>
        </div>
      </header>

      {/* ... (Seções TANQUES e PRATELEIRA IGUAIS AO ANTERIOR) ... */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Em Maturação (Tanques)</h2>
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

      <section className="mb-12">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Pronta Entrega (Estoque Atual)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-yellow-900 mb-6 flex items-center gap-2">🍋 Limoncello</h3>
              <div className="space-y-2"><StockRow produto="limoncello" tamanho={750} colorText="text-yellow-600" /><StockRow produto="limoncello" tamanho={375} colorText="text-yellow-600" /></div>
            </div>
          </div>
          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-orange-900 mb-6 flex items-center gap-2">🍊 Arancello</h3>
              <div className="space-y-2"><StockRow produto="arancello" tamanho={750} colorText="text-orange-600" /><StockRow produto="arancello" tamanho={375} colorText="text-orange-600" /></div>
            </div>
          </div>
          <div className="bg-lime-50 p-8 rounded-3xl border border-lime-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-lime-900 mb-6 flex items-center gap-2">🍯 Xarope</h3>
              <div className="space-y-2">
                <div className="bg-white/80 p-3 rounded-xl backdrop-blur-sm flex justify-between items-center h-[68px]"><span className="text-xs font-bold text-lime-700 uppercase">Garrafa 1L</span><span className="text-2xl font-black text-gray-900">{getQtd('xarope')}</span></div>
                <div className="bg-lime-100/50 p-3 rounded-xl flex justify-center items-center h-[68px]"><span className="text-[10px] font-bold text-lime-800 uppercase">L. Siciliano</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ESTATÍSTICAS (MANTIDO O LAYOUT NOVO, MAS COM DADOS DO RPC) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-32">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Total</span>
              <div className="text-3xl font-black text-green-600 tracking-tight">R$ {indicadores.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-gray-400 font-bold bg-green-50 w-fit px-2 py-1 rounded text-green-700">Receita Bruta</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 min-h-32">
              <div className="flex justify-between items-start">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendas Realizadas</span>
                 <span className="text-xs font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{indicadores.vendas.total} un</span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-sm bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                      <span className="font-bold text-purple-900 flex items-center gap-1">🍋 Limoncello</span>
                      <div className="flex gap-3 text-xs font-mono font-bold text-gray-600">
                          <span title="750ml">{indicadores.vendas.limoncello750}<span className="text-gray-300 ml-0.5">G</span></span>
                          <span className="text-gray-300">|</span>
                          <span title="375ml">{indicadores.vendas.limoncello375}<span className="text-gray-300 ml-0.5">P</span></span>
                      </div>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                      <span className="font-bold text-purple-900 flex items-center gap-1">🍊 Arancello</span>
                      <div className="flex gap-3 text-xs font-mono font-bold text-gray-600">
                          <span title="750ml">{indicadores.vendas.arancello750}<span className="text-gray-300 ml-0.5">G</span></span>
                          <span className="text-gray-300">|</span>
                          <span title="375ml">{indicadores.vendas.arancello375}<span className="text-gray-300 ml-0.5">P</span></span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 min-h-32">
              <div className="flex justify-between items-start">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produção Total</span>
                 <span className="text-xs font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{indicadores.producao.total} un</span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-sm bg-yellow-50/50 p-2 rounded-lg border border-yellow-100">
                      <span className="font-bold text-yellow-700 flex items-center gap-1">🍋 Limoncello</span>
                      <div className="flex gap-3 text-xs font-mono font-bold text-gray-600">
                          <span title="750ml">{indicadores.producao.limoncello750}<span className="text-gray-300 ml-0.5">G</span></span>
                          <span className="text-gray-300">|</span>
                          <span title="375ml">{indicadores.producao.limoncello375}<span className="text-gray-300 ml-0.5">P</span></span>
                      </div>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                      <span className="font-bold text-orange-700 flex items-center gap-1">🍊 Arancello</span>
                      <div className="flex gap-3 text-xs font-mono font-bold text-gray-600">
                          <span title="750ml">{indicadores.producao.arancello750}<span className="text-gray-300 ml-0.5">G</span></span>
                          <span className="text-gray-300">|</span>
                          <span title="375ml">{indicadores.producao.arancello375}<span className="text-gray-300 ml-0.5">P</span></span>
                      </div>
                  </div>
              </div>
          </div>

        </div>
      </section>

      {/* ... (MODAL DETALHE e MODAL VENDA MANTIDOS) ... */}
      {detailOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 capitalize">{detailData.produto} {detailData.tamanho}ml</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase">Detalhamento por Lote</p>
                    </div>
                    <button onClick={() => setDetailOpen(false)} className="text-gray-400 hover:text-black font-bold p-2 text-xl cursor-pointer">✕</button>
                </div>
                
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {detailData.itens.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nenhum lote com estoque.</p>
                    ) : (
                        detailData.itens.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Lote</span>
                                    <span className="font-mono font-bold text-gray-900">{item.id}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lg font-black text-gray-900">{item.qtd}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Unidades</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">Total Geral: <span className="text-black font-bold">{getQtd(`${detailData.produto}_${detailData.tamanho}`)}</span> un</p>
                </div>
            </div>
        </div>
      )}

      <ModalVenda isOpen={isVendaOpen} onClose={() => { setIsVendaOpen(false); fetchIndicadores(); }} />
    </div>
  )
}