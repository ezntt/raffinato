"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function InsumosList({ insumos }: { insumos: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  
  // States do Modal de Compra
  const [selectedId, setSelectedId] = useState('')
  const [qtdCompra, setQtdCompra] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [codigoCompra, setCodigoCompra] = useState('') // NOVO
  const [fornecedor, setFornecedor] = useState('')     // NOVO
  const [obs, setObs] = useState('')

  const ingredientes = insumos.filter(i => i.categoria === 'ingrediente')
  const embalagens = insumos.filter(i => i.categoria === 'embalagem')
  const itemSelecionado = insumos.find(i => i.id === selectedId)

  const handleSalvarCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!selectedId) return alert("Selecione um insumo")
    
    setLoading(true)
    try {
        // Atualiza a tabela Insumo
        await supabase.from('Insumo')
            .update({ quantidade_atual: itemSelecionado.quantidade_atual + Number(qtdCompra) })
            .eq('id', selectedId)

        // Salva histórico com os dados novos
        const { error } = await supabase.from('MovimentacaoInsumo').insert({
            insumo_id: selectedId,
            tipo: 'compra',
            quantidade: Number(qtdCompra),
            valor_total: Number(valorTotal),
            codigo_compra: codigoCompra, // Salva codigo
            fornecedor: fornecedor,      // Salva fornecedor
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

  const CardInsumo = ({ item }: { item: any }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-gray-300 transition-colors">
        <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {item.categoria}
            </span>
            <h3 className="font-bold text-gray-900 text-lg">{item.nome}</h3>
        </div>
        <div className="text-right">
            <span className="block text-2xl font-black text-gray-900">
                {item.quantidade_atual} <small className="text-sm text-gray-500 font-medium">{item.unidade}</small>
            </span>
            {item.quantidade_atual <= item.estoque_minimo && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    Baixo
                </span>
            )}
        </div>
    </div>
  )

  return (
    <>
      <div className="flex justify-end mb-6">
        <button 
            onClick={() => setModalOpen(true)}
            className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
            <span>+ Registrar Compra</span>
        </button>
      </div>

      <div className="space-y-8">
        <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">🍋 Ingredientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredientes.map(item => <CardInsumo key={item.id} item={item} />)}
            </div>
        </section>
        <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">📦 Embalagens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {embalagens.map(item => <CardInsumo key={item.id} item={item} />)}
            </div>
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Registrar Compra 🛒</h2>
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

                    {/* NOVOS CAMPOS DE CONTROLE */}
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