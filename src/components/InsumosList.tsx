"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ComprasList } from './ComprasList'

export function InsumosList({ insumos, historico }: { insumos: any[], historico: any[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'estoque' | 'historico'>('estoque')
  
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [qtdCompra, setQtdCompra] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [codigoCompra, setCodigoCompra] = useState('') 
  const [fornecedor, setFornecedor] = useState('')     
  const [obs, setObs] = useState('')

  const ingredientes = insumos.filter(i => i.categoria === 'ingrediente')
  const embalagens = insumos.filter(i => i.categoria === 'embalagem')
  const itemSelecionado = insumos.find(i => i.id === selectedId)

  const handleSalvarCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!selectedId) return alert("Selecione um insumo")
    
    setLoading(true)
    try {
        await supabase.from('Insumo')
            .update({ quantidade_atual: itemSelecionado.quantidade_atual + Number(qtdCompra) })
            .eq('id', selectedId)

        const { error } = await supabase.from('MovimentacaoInsumo').insert({
            insumo_id: selectedId,
            tipo: 'compra',
            quantidade: Number(qtdCompra),
            valor_total: Number(valorTotal),
            codigo_compra: codigoCompra, 
            fornecedor: fornecedor,      
            observacao: obs
        })

        if (error) throw error

        alert("Compra registrada!")
        setModalOpen(false)
        setQtdCompra(''); setValorTotal(''); setObs(''); setSelectedId(''); setCodigoCompra(''); setFornecedor('')
        router.refresh()

    } catch (err: any) {
        alert("Erro: " + err.message)
    } finally {
        setLoading(false)
    }
  }

  const formatarQuantidade = (valor: number) => {
    // Se for 0 ou undefined
    if (!valor) return '0'
    // Arredonda para 2 casas decimais
    const arredondado = Math.floor(valor * 100) / 100
    return arredondado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }

  const CardInsumo = ({ item }: { item: any }) => {
    // Verifica se é negativo para aplicar a cor
    const isNegativo = item.quantidade_atual < 0

    return (
      <div className={`bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center transition-colors ${isNegativo ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-gray-300'}`}>
          <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {item.categoria}
              </span>
              <h3 className="font-bold text-gray-900 text-lg">{item.nome}</h3>
          </div>
          <div className="text-right">
              {/* AQUI ESTÁ A MUDANÇA DE COR */}
              <span className={`block text-2xl font-black ${isNegativo ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatarQuantidade(item.quantidade_atual)} 
                  <small className={`text-sm font-medium ml-1 ${isNegativo ? 'text-red-400' : 'text-gray-500'}`}>
                    {item.unidade}
                  </small>
              </span>
              
              {item.quantidade_atual <= item.estoque_minimo && !isNegativo && (
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                      Baixo
                  </span>
              )}

              {isNegativo && (
                  <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-full animate-pulse">
                      NEGATIVO
                  </span>
              )}
          </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('estoque')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'estoque' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Estoque Atual
            </button>
            <button 
                onClick={() => setActiveTab('historico')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'historico' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-red-500'}`}
            >
                Histórico Compras
            </button>
        </div>

        <button 
            onClick={() => setModalOpen(true)}
            className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"
        >
            <span>+ Registrar Compra</span>
        </button>
      </div>

      {activeTab === 'estoque' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <section>
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">Ingredientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ingredientes.map(item => <CardInsumo key={item.id} item={item} />)}
                </div>
            </section>
            <section>
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">Embalagens</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {embalagens.map(item => <CardInsumo key={item.id} item={item} />)}
                </div>
            </section>
          </div>
      ) : (
          <ComprasList compras={historico} />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Registrar Compra </h2>
                    <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-black font-bold p-2 text-xl cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleSalvarCompra} className="space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Insumo</label>
                        <select required value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold cursor-pointer">
                            <option value="">Selecione...</option>
                            <optgroup label="Ingredientes">{ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}</optgroup>
                            <optgroup label="Embalagens">{embalagens.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}</optgroup>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qtd {itemSelecionado ? `(${itemSelecionado.unidade})` : ''}</label>
                            <input type="number" step="0.01" required value={qtdCompra} onChange={e => setQtdCompra(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold" placeholder="0" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Total (R$)</label>
                            <input type="number" step="0.01" required value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none focus:border-green-500 text-green-900 font-bold" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nº Nota / Pedido</label>
                            <input value={codigoCompra} onChange={e => setCodigoCompra(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="NF 123" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Fornecedor</label>
                            <input value={fornecedor} onChange={e => setFornecedor(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="Vidros Sul" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Observação</label>
                        <input value={obs} onChange={e => setObs(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="Ex: Marca Y" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 mt-4 cursor-pointer">
                        {loading ? 'Salvando...' : 'Confirmar Compra'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </>
  )
}