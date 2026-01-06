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

  // Estados para armazenar o estoque atual dos insumos
  const [estGarrafas, setEstGarrafas] = useState<number>(0)
  const [estRolhas, setEstRolhas] = useState<number>(0)
  const [estRotulos, setEstRotulos] = useState<number>(0)

  // Busca os estoques sempre que o modal abre ou o tamanho muda
  useEffect(() => {
    if (isOpen) {
        setLoading(true) 
        fetchInsumos()
        .finally(() => setLoading(false))
    }
  }, [isOpen, tamanho])

  const fetchInsumos = async () => {
    try {
        console.log("🔄 Buscando insumos no banco...")
        
        const nomeGarrafaAlvo = tamanho === 750 ? '750ml' : '375ml' // Ajuste se necessário ('750' ou '375')
        
        // CORREÇÃO AQUI: Mudado de 'quantidade' para 'quantidade_atual'
        const { data, error } = await supabase
            .from('Insumo')
            .select('nome, quantidade_atual') 
        
        if (error) throw error

        console.log("📦 Insumos encontrados:", data)

        if (data) {
            // Garrafas
            const garrafa = data.find(i => 
                i.nome.toLowerCase().includes('garrafa') && 
                i.nome.toLowerCase().includes(nomeGarrafaAlvo)
            )

            // Rolhas / Tampas
            const rolha = data.find(i => 
                i.nome.toLowerCase().includes('rolha') || 
                i.nome.toLowerCase().includes('tampa')
            )

            // Rótulos
            const rotulo = data.find(i => 
                i.nome.toLowerCase().includes('rotulo') || 
                i.nome.toLowerCase().includes('rótulo')
            )

            // CORREÇÃO AQUI: Lendo a propriedade .quantidade_atual
            setEstGarrafas(garrafa?.quantidade_atual || 0)
            setEstRolhas(rolha?.quantidade_atual || 0)
            setEstRotulos(rotulo?.quantidade_atual || 0)
        }
    } catch (err) {
        console.error("❌ Erro ao buscar estoque:", err)
    }
  }

  if (!isOpen || !lote) return null

  const nQtd = Number(qtdGarrafas) || 0
  const litrosGastos = (nQtd * tamanho) / 1000
  
  // Cálculos de saldo final
  const saldoGarrafas = estGarrafas - nQtd
  const saldoRolhas = estRolhas - nQtd
  const saldoRotulos = estRotulos - nQtd
  
  // Verifica se falta algum insumo
  const temInsumosSuficientes = saldoGarrafas >= 0 && saldoRolhas >= 0 && saldoRotulos >= 0

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nQtd <= 0) return alert("Digite uma quantidade válida.")
    
    if (litrosGastos > lote.volume_atual) {
        return alert(`Erro: Faltam ${(litrosGastos - lote.volume_atual).toFixed(2)}L de bebida no tanque.`)
    }

    if (!temInsumosSuficientes) {
        return alert("Erro: Você não tem insumos secos (garrafas/rolhas/rótulos) suficientes no estoque.")
    }

    setLoading(true)

    try {
      const { error } = await supabase.rpc('engarrafar_lote', {
        p_lote_id: lote.id,
        p_produto: lote.produto,
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

  // Componente auxiliar para linha de resumo
  const RowInsumo = ({ label, atual, final }: { label: string, atual: number, final: number }) => (
    <div className={`flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-1 ${final < 0 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
        <span>{label}</span>
        <div className="flex gap-4">
            <span className="text-gray-400 text-xs mt-0.5">({atual} un)</span>
            <span>➜ {final} un</span>
        </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2">✕</button>

        <h2 className="text-2xl font-black text-gray-900 mb-1">Engarrafar Lote 🍾</h2>
        <p className="text-sm text-gray-500 mb-6">Lote: <span className="font-mono font-bold text-black">{lote.id}</span></p>

        <form onSubmit={handleConfirm} className="space-y-5">
          
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

          {/* Resumo do Tanque (Líquido) */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-1">
            <div className="text-xs font-bold text-blue-800 uppercase mb-2">Tanque (Líquido)</div>
            <div className="flex justify-between items-center text-sm text-blue-900 font-medium">
                <span>Consumo:</span>
                <span>- {litrosGastos.toFixed(2)} Litros</span>
            </div>
            <div className={`flex justify-between items-center text-sm font-bold ${(lote.volume_atual - litrosGastos) < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                <span>Restante no Tanque:</span>
                <span>{(lote.volume_atual - litrosGastos).toFixed(2)} Litros</span>
            </div>
          </div>

          {/* Resumo de Insumos (Secos) */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="text-xs font-bold text-gray-400 uppercase mb-2">Estoque de Insumos</div>
             <div className="space-y-1">
                <RowInsumo label={tamanho === 750 ? "Garrafas 750ml" : "Garrafas 375ml"} atual={estGarrafas} final={saldoGarrafas} />
                <RowInsumo label="Rolhas / Tampas" atual={estRolhas} final={saldoRolhas} />
                <RowInsumo label="Rótulos" atual={estRotulos} final={saldoRotulos} />
             </div>
             {!temInsumosSuficientes && (
                 <div className="mt-2 text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded">
                    Estoque insuficiente para essa produção!
                 </div>
             )}
          </div>

          <button 
            type="submit" 
            disabled={loading || nQtd <= 0 || !temInsumosSuficientes || (lote.volume_atual - litrosGastos) < 0}
            className="w-full bg-green-600 cursor-pointer hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Confirmar Produção'}
          </button>

        </form>
      </div>
    </div>
  )
} 