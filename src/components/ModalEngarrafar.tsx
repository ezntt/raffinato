"use client"
import { useState, useEffect } from 'react'
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

  // Estados de Estoque
  const [estGarrafas, setEstGarrafas] = useState<number>(0)
  const [estRolhas, setEstRolhas] = useState<number>(0)
  const [estRotulos, setEstRotulos] = useState<number>(0)
  const [estLacres, setEstLacres] = useState<number>(0)

  // Função auxiliar para capitalizar (limoncello -> Limoncello)
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

  useEffect(() => {
    if (isOpen && lote) {
        setLoading(true) 
        fetchInsumos()
        .finally(() => setLoading(false))
    }
  }, [isOpen, tamanho, lote])

  const fetchInsumos = async () => {
    try {
        const { data, error } = await supabase
            .from('Insumo')
            .select('nome, quantidade_atual') 
        
        if (error) throw error

        if (data) {
            // 1. Definição dos nomes EXATOS conforme sua lista
            const nomeGarrafa = `Garrafa Vidro ${tamanho}ml`
            const nomeRotulo = `Rótulo ${capitalize(lote.produto)} ${tamanho}ml` // Ex: Rótulo Limoncello 750ml
            const nomeTampa = "Tampa"
            const nomeLacre = "Lacre"

            // 2. Busca Exata
            const itemGarrafa = data.find(i => i.nome === nomeGarrafa)
            const itemRotulo = data.find(i => i.nome === nomeRotulo)
            const itemTampa = data.find(i => i.nome === nomeTampa)
            const itemLacre = data.find(i => i.nome === nomeLacre)

            setEstGarrafas(itemGarrafa?.quantidade_atual || 0)
            setEstRotulos(itemRotulo?.quantidade_atual || 0)
            setEstRolhas(itemTampa?.quantidade_atual || 0) // Usando variável estRolhas para Tampa
            setEstLacres(itemLacre?.quantidade_atual || 0)
        }
    } catch (err) {
        console.error("Erro ao buscar estoque:", err)
    }
  }

  if (!isOpen || !lote) return null

  const nQtd = Number(qtdGarrafas) || 0
  const litrosGastos = (nQtd * tamanho) / 1000
  
  // Cálculos de saldo final
  const saldoGarrafas = estGarrafas - nQtd
  const saldoRotulos = estRotulos - nQtd
  const saldoTampas = estRolhas - nQtd
  const saldoLacres = estLacres - nQtd
  
  // Verifica se falta algum insumo (para alerta visual)
  const faltaInsumo = saldoGarrafas < 0 || saldoRotulos < 0 || saldoTampas < 0 || saldoLacres < 0
  
  // Bloqueio Rígido apenas para Líquido
  const faltaLiquido = (lote.volume_atual - litrosGastos) < 0

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nQtd <= 0) return alert("Digite uma quantidade válida.")
    
    if (faltaLiquido) {
        return alert(`Erro Crítico: Faltam ${(litrosGastos - lote.volume_atual).toFixed(2)}L de bebida no tanque.`)
    }

    if (faltaInsumo) {
        const confirm = window.confirm("⚠️ ATENÇÃO: Alguns insumos ficarão com estoque NEGATIVO. Deseja forçar a produção mesmo assim?")
        if (!confirm) return
    }

    setLoading(true)

    try {
      // Chamada RPC atualizada (ver SQL abaixo)
      const { error } = await supabase.rpc('engarrafar_lote', {
        p_lote_id: lote.id,
        p_produto: lote.produto, // passa 'limoncello' ou 'arancello'
        p_tamanho: tamanho,
        p_qtd: nQtd
      })

      if (error) throw error

      alert(`Sucesso! ${nQtd} garrafas produzidas. Estoques atualizados.`)
      router.refresh()
      onClose()
      setQtdGarrafas('') 

    } catch (err: any) {
      alert("Erro ao engarrafar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const RowInsumo = ({ label, atual, final }: { label: string, atual: number, final: number }) => (
    <div className={`flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-1 ${final < 0 ? 'text-red-600 font-bold bg-red-50 px-2 rounded' : 'text-gray-600'}`}>
        <span>{label}</span>
        <div className="flex gap-4">
            <span className="text-gray-400 text-xs mt-0.5">({atual})</span>
            <span>➜ {final}</span>
        </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2">✕</button>

        {/* INDICATIVO DE PRODUTO (BADGE) */}
        <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                lote.produto === 'limoncello' 
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                : 'bg-orange-100 text-orange-700 border-orange-200'
            }`}>
                {lote.produto}
            </span>
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-1 text-center">Engarrafar Lote 🍾</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Lote: <span className="font-mono font-bold text-black">{lote.id}</span></p>

        <form onSubmit={handleConfirm} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTamanho(750)} className={`p-3 rounded-xl border-2 font-bold transition-all ${tamanho === 750 ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Garrafa 750ml</button>
            <button type="button" onClick={() => setTamanho(375)} className={`p-3 rounded-xl border-2 font-bold transition-all ${tamanho === 375 ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Pequena 375ml</button>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Quantidade de Garrafas</label>
            <input type="number" autoFocus value={qtdGarrafas} onChange={e => setQtdGarrafas(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-3xl font-black text-gray-900 text-center" placeholder="0" />
          </div>

          {/* Resumo do Tanque */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-1">
            <div className="text-xs font-bold text-blue-800 uppercase mb-2">Tanque (Líquido)</div>
            <div className={`flex justify-between items-center text-sm font-bold ${(lote.volume_atual - litrosGastos) < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                <span>Restante no Tanque:</span>
                <span>{(lote.volume_atual - litrosGastos).toFixed(2)} Litros</span>
            </div>
          </div>

          {/* Resumo de Insumos */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="text-xs font-bold text-gray-400 uppercase mb-2">Estoque de Insumos</div>
             <div className="space-y-1">
                <RowInsumo label={`Garrafa ${tamanho}ml`} atual={estGarrafas} final={saldoGarrafas} />
                <RowInsumo label={`Rótulo ${capitalize(lote.produto)}`} atual={estRotulos} final={saldoRotulos} />
                <RowInsumo label="Tampa" atual={estRolhas} final={saldoTampas} />
                <RowInsumo label="Lacre" atual={estLacres} final={saldoLacres} />
             </div>
          </div>

          {/* BOTÃO INTELIGENTE */}
          <button 
            type="submit" 
            disabled={loading || nQtd <= 0 || faltaLiquido}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${faltaInsumo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}
            `}
          >
            {loading ? 'Processando...' : (faltaInsumo ? '⚠️ Forçar Produção' : 'Confirmar Produção')}
          </button>

        </form>
      </div>
    </div>
  )
}