"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { NOME_INSUMO } from '@/lib/constants'
import { ModalAlerta } from './ModalAlerta'
import type { AlertType } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalMaceracao({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')
  const [qtd, setQtd] = useState('')
  
  // Estados para Modal
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  
  // IDs dos Insumos
  const [idAlcoolPuro, setIdAlcoolPuro] = useState<string>('')
  const [idDestino, setIdDestino] = useState<string>('')
  
  const [saldoPuro, setSaldoPuro] = useState(0)

  useEffect(() => {
    if (isOpen) fetchInsumos()
  }, [isOpen, tipo])

  const fetchInsumos = async () => {
    // Busca Álcool e a Base com Casca correta
    const nomeDestino = tipo === 'limoncello' ? NOME_INSUMO.BASE_LIMONCELLO_CASCA : NOME_INSUMO.BASE_ARANCELLO_CASCA

    const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
    if (data) {
      const puro = data.find(i => i.nome === NOME_INSUMO.ALCOOL)
      const baseAlvo = data.find(i => i.nome === nomeDestino)

      if (puro) { setIdAlcoolPuro(puro.id); setSaldoPuro(puro.quantidade_atual) }
      if (baseAlvo) setIdDestino(baseAlvo.id)
    }
  }

  const handleMacerar = async (e: React.FormEvent) => {
    e.preventDefault()
    const volume = Number(qtd)
    if (volume <= 0) {
      setAlerta({ isOpen: true, title: 'Inválido', message: 'A quantidade deve ser maior que 0', type: 'error' })
      return
    }
    if (!idDestino) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Base com casca não encontrada no banco. Verifique os nomes.', type: 'error' })
      return
    }
    
    setLoading(true)
    try {
        // Atualiza valores
        const { data: itens } = await supabase.from('Insumo').select('id, quantidade_atual').in('id', [idAlcoolPuro, idDestino])
        const itemPuro = itens?.find(i => i.id === idAlcoolPuro)
        const itemDestino = itens?.find(i => i.id === idDestino)

        if (!itemPuro || !itemDestino) throw new Error("Itens não encontrados")

        // Subtrai do Álcool
        await supabase.from('Insumo').update({ quantidade_atual: itemPuro.quantidade_atual - volume }).eq('id', idAlcoolPuro)
        // Adiciona na Base COM Casca
        await supabase.from('Insumo').update({ quantidade_atual: itemDestino.quantidade_atual + volume }).eq('id', idDestino)

        await supabase.from('Logs').insert({
            categoria: 'MACERACAO',
            acao: 'INICIO',
            descricao: `Iniciou maceração de ${volume}L para Base ${tipo} (com casca)`
        })

        setAlerta({ isOpen: true, title: 'Sucesso', message: 'Maceração iniciada!', type: 'success' })
        router.refresh()
        onClose()
        setQtd('')
    } catch (err: any) {
        setAlerta({ isOpen: true, title: 'Erro', message: err.message, type: 'error' })
    } finally {
        setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-gray-900">Nova Maceração</h2>
            <button onClick={onClose} className="text-gray-400  hover:text-black font-bold p-2">✕</button>
        </div>

        <form onSubmit={handleMacerar} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm text-blue-800">
                <span className="font-bold block">Estoque de Álcool Puro:</span>
                <span className="text-xl font-black">{saldoPuro} L</span>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Produto</label>
                <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setTipo('limoncello')} className={`flex-1  py-2 rounded-lg font-bold text-sm border-2 ${tipo === 'limoncello' ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-transparent bg-gray-100 text-gray-400'}`}>Limoncello</button>
                    <button type="button" onClick={() => setTipo('arancello')} className={`flex-1  py-2 rounded-lg font-bold text-sm border-2 ${tipo === 'arancello' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-transparent bg-gray-100 text-gray-400'}`}>Arancello</button>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qtd. Álcool (Litros)</label>
                <input type="number" step="0.1" autoFocus value={qtd} onChange={e => setQtd(e.target.value)} className="w-full text-gray-900 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black font-bold text-xl" placeholder="0" />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">A quantidade de cascas não altera o estoque.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full  bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Processando...' : 'Confirmar'}
            </button>
        </form>
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