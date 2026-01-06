"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  lote: any
}

export function ModalEngarrafar({ isOpen, onClose, lote }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [tamanho, setTamanho] = useState<number>(750)
  const [qtdGarrafas, setQtdGarrafas] = useState<string>('')

  if (!isOpen || !lote) return null

  const nQtd = Number(qtdGarrafas) || 0
  const litrosGastos = (nQtd * tamanho) / 1000

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nQtd <= 0) return alert("Digite uma quantidade válida.")
    
    if (litrosGastos > lote.volume_atual) {
        return alert(`Erro: Você precisa de ${litrosGastos}L, mas o lote só tem ${lote.volume_atual}L.`)
    }

    setLoading(true)

    try {
      const { error } = await supabase.rpc('engarrafar_lote', {
        p_lote_id: lote.id,
        p_produto: lote.produto, // limoncello ou arancello
        p_tamanho: tamanho,
        p_qtd: nQtd
      })

      if (error) throw error

      alert(`Sucesso! ${nQtd} garrafas adicionadas ao estoque.`)
      router.refresh()
      onClose()
      setQtdGarrafas('') // Limpa campo

    } catch (err: any) {
      alert("Erro ao engarrafar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2">✕</button>

        <h2 className="text-2xl font-black text-gray-900 mb-1">Engarrafar Lote 🍾</h2>
        <p className="text-sm text-gray-500 mb-6">Lote: <span className="font-mono font-bold text-black">{lote.id}</span> • Restam: {lote.volume_atual}L</p>

        <form onSubmit={handleConfirm} className="space-y-6">
          
          {/* Seleção de Tamanho */}
          <div className="grid grid-cols-2 gap-3">
            <button 
                type="button"
                onClick={() => setTamanho(750)}
                className={`p-3 rounded-xl border-2 font-bold transition-all ${tamanho === 750 ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
                Garrafa 750ml
            </button>
            <button 
                type="button"
                onClick={() => setTamanho(375)}
                className={`p-3 rounded-xl border-2 font-bold transition-all ${tamanho === 375 ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
                Pequena 375ml
            </button>
          </div>

          {/* Input Quantidade */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Quantidade de Garrafas</label>
            <input 
                type="number" 
                autoFocus
                value={qtdGarrafas}
                onChange={e => setQtdGarrafas(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-3xl font-black text-gray-900"
                placeholder="0"
            />
          </div>

          {/* Resumo do Impacto */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center text-sm font-bold text-blue-800 mb-1">
                <span>Vai consumir do Tanque:</span>
                <span>- {litrosGastos.toFixed(2)} Litros</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                <span>Sobrará no Tanque:</span>
                <span>{(lote.volume_atual - litrosGastos).toFixed(2)} Litros</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || nQtd <= 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Confirmar Produção'}
          </button>

        </form>
      </div>
    </div>
  )
}