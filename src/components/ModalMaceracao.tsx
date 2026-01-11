"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { NOME_INSUMO } from '@/lib/constants'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalMaceracao({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')
  const [qtd, setQtd] = useState('')
  
  // IDs dos Insumos
  const [idAlcoolPuro, setIdAlcoolPuro] = useState<string>('')
  const [idBaseL, setIdBaseL] = useState<string>('')
  const [idBaseA, setIdBaseA] = useState<string>('')
  
  // Saldos para exibição
  const [saldoPuro, setSaldoPuro] = useState(0)

  useEffect(() => {
    if (isOpen) fetchInsumos()
  }, [isOpen])

  const fetchInsumos = async () => {
    const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
    if (data) {
      const puro = data.find(i => i.nome === NOME_INSUMO.ALCOOL)
      const baseL = data.find(i => i.nome === NOME_INSUMO.BASE_LIMONCELLO)
      const baseA = data.find(i => i.nome === NOME_INSUMO.BASE_ARANCELLO)

      if (puro) { setIdAlcoolPuro(puro.id); setSaldoPuro(puro.quantidade_atual) }
      if (baseL) setIdBaseL(baseL.id)
      if (baseA) setIdBaseA(baseA.id)
    }
  }

  const handleMacerarDireto = async (e: React.FormEvent) => {
    e.preventDefault()
    const volume = Number(qtd)
    if (volume <= 0) return alert("Inválido")
    
    const idDestino = tipo === 'limoncello' ? idBaseL : idBaseA
    
    setLoading(true)
    try {
        // Busca valores atuais frescos
        const { data: itens } = await supabase.from('Insumo').select('id, quantidade_atual').in('id', [idAlcoolPuro, idDestino])
        const itemPuro = itens?.find(i => i.id === idAlcoolPuro)
        const itemDestino = itens?.find(i => i.id === idDestino)

        if (!itemPuro || !itemDestino) throw new Error("Itens não encontrados")

        // Updates
        await supabase.from('Insumo').update({ quantidade_atual: itemPuro.quantidade_atual - volume }).eq('id', idAlcoolPuro)
        await supabase.from('Insumo').update({ quantidade_atual: itemDestino.quantidade_atual + volume }).eq('id', idDestino)

        // Log simplificado na tabela Logs
        await supabase.from('Logs').insert({
            categoria: 'ESTOQUE',
            acao: 'MACERACAO',
            descricao: `Converteu ${volume}L de Álcool Puro para Base ${tipo}`
        })

        alert("Registrado!")
        router.refresh()
        onClose()
        setQtd('')
    } catch (err: any) {
        alert("Erro: " + err.message)
    } finally {
        setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-gray-900">Registrar Maceração</h2>
            <button onClick={onClose} className="text-gray-400 cursor-pointer hover:text-black font-bold p-2">✕</button>
        </div>

        <form onSubmit={handleMacerarDireto} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm text-blue-800">
                <span className="font-bold block">Estoque de {NOME_INSUMO.ALCOOL}:</span>
                <span className="text-xl font-black">{saldoPuro} L</span>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Destino (Produto)</label>
                <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setTipo('limoncello')} className={`flex-1 cursor-pointer py-2 rounded-lg font-bold text-sm border-2 ${tipo === 'limoncello' ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-transparent bg-gray-100 text-gray-400'}`}>Limoncello</button>
                    <button type="button" onClick={() => setTipo('arancello')} className={`flex-1 cursor-pointer py-2 rounded-lg font-bold text-sm border-2 ${tipo === 'arancello' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-transparent bg-gray-100 text-gray-400'}`}>Arancello</button>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantidade (Litros)</label>
                <input type="number" step="0.1" autoFocus value={qtd} onChange={e => setQtd(e.target.value)} className="w-full text-gray-900 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black font-bold text-xl" placeholder="0" />
            </div>

            <button type="submit" disabled={loading} className="w-full cursor-pointer bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Processando...' : 'Confirmar Maceração'}
            </button>
        </form>
      </div>
    </div>
  )
}