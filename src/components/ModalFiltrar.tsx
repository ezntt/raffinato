"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { NOME_INSUMO } from '@/lib/constants'

interface Props {
  isOpen: boolean
  onClose: () => void
  tipoInicial: 'limoncello' | 'arancello'
}

export function ModalFiltrar({ isOpen, onClose, tipoInicial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Inputs Manuais
  const [qtdBaixa, setQtdBaixa] = useState('') // Quanto tiro do balde com casca
  const [qtdEntrada, setQtdEntrada] = useState('') // Quanto rendeu de líquido limpo

  const [estoqueCasca, setEstoqueCasca] = useState(0)
  const [ids, setIds] = useState({ casca: '', filtrada: '' })

  useEffect(() => {
    if (isOpen) fetchDados()
  }, [isOpen, tipoInicial])

  const fetchDados = async () => {
    const nomeCasca = tipoInicial === 'limoncello' ? NOME_INSUMO.BASE_LIMONCELLO_CASCA : NOME_INSUMO.BASE_ARANCELLO_CASCA
    const nomeFiltrada = tipoInicial === 'limoncello' ? NOME_INSUMO.BASE_LIMONCELLO_FILTRADA : NOME_INSUMO.BASE_ARANCELLO_FILTRADA

    const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual').in('nome', [nomeCasca, nomeFiltrada])
    
    if (data) {
        const itemCasca = data.find(i => i.nome === nomeCasca)
        const itemFiltrada = data.find(i => i.nome === nomeFiltrada)
        
        if (itemCasca) {
            setEstoqueCasca(itemCasca.quantidade_atual)
            setIds(prev => ({ ...prev, casca: itemCasca.id }))
        }
        if (itemFiltrada) {
            setIds(prev => ({ ...prev, filtrada: itemFiltrada.id }))
        }
    }
  }

  const handleFiltrar = async (e: React.FormEvent) => {
      e.preventDefault()
      const baixa = Number(qtdBaixa)
      const entrada = Number(qtdEntrada)

      if (baixa <= 0 || entrada <= 0) return alert("Valores inválidos")
      if (entrada > baixa) {
          if(!confirm("Atenção: Você está dizendo que rendeu MAIS líquido do que tinha na maceração. Isso está certo?")) return
      }

      setLoading(true)
      try {
          // 1. Baixa na COM CASCA
          const { error: err1 } = await supabase.rpc('increment_insumo', { x_id: ids.casca, x_qtd: -baixa })
          if(err1) throw err1 // Fallback se RPC nao existir: update normal

          // 2. Entrada na FILTRADA
          const { error: err2 } = await supabase.rpc('increment_insumo', { x_id: ids.filtrada, x_qtd: entrada })
          // Se nao tiver RPC configurada, faça updates normais aqui:
          // await supabase.from('Insumo').update({ quantidade_atual: estoqueCasca - baixa }).eq('id', ids.casca)
          // buscar valor atual da filtrada e somar... etc.
          
          // Log
          await supabase.from('Logs').insert({
              categoria: 'MACERACAO',
              acao: 'FILTRAGEM',
              descricao: `Filtrou ${baixa}L de base com casca e obteve ${entrada}L de base limpa (${tipoInicial}). Perda: ${(baixa-entrada).toFixed(2)}L`
          })

          alert("Filtragem concluída! Estoques atualizados.")
          router.refresh()
          onClose()
          setQtdBaixa(''); setQtdEntrada('')
      } catch (err: any) {
        // Fallback simples caso RPC falhe ou nao exista
        try {
            await supabase.from('Insumo').update({ quantidade_atual: estoqueCasca - baixa }).eq('id', ids.casca)
            
            // Busca atual da filtrada pra somar
            const { data: d } = await supabase.from('Insumo').select('quantidade_atual').eq('id', ids.filtrada).single()
            if(d) await supabase.from('Insumo').update({ quantidade_atual: d.quantidade_atual + entrada }).eq('id', ids.filtrada)
            
            alert("Filtragem salva (modo fallback)!")
            router.refresh()
            onClose()
        } catch (subErr) {
            alert("Erro crítico: " + err.message)
        }
      } finally {
          setLoading(false)
      }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">Filtrar Base {tipoInicial === 'limoncello' ? 'Limoncello' : 'Arancello'}</h2>
                <button onClick={onClose} className="text-gray-400 font-bold p-2 hover:text-black">✕</button>
            </div>
            
            <form onSubmit={handleFiltrar} className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-900">
                    <p className="text-xs font-bold uppercase mb-1">Passo 1: O que sai</p>
                    <label className="block text-sm font-bold mb-2">Quanto você retirou da Maceração? (L)</label>
                    <div className="flex items-center gap-2">
                        <input type="number" step="0.1" required value={qtdBaixa} onChange={e => setQtdBaixa(e.target.value)} className="w-full p-2 bg-white border border-orange-200 rounded-lg font-bold text-lg outline-none focus:border-orange-500" placeholder="Ex: 20" />
                        <span className="text-xs font-bold text-orange-400 whitespace-nowrap">Disponível: {estoqueCasca}L</span>
                    </div>
                </div>

                <div className="flex justify-center text-gray-300">⬇️</div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-900">
                    <p className="text-xs font-bold uppercase mb-1">Passo 2: O que entra</p>
                    <label className="block text-sm font-bold mb-2">Quanto rendeu de Líquido Limpo? (L)</label>
                    <input type="number" step="0.1" required value={qtdEntrada} onChange={e => setQtdEntrada(e.target.value)} className="w-full p-2 bg-white border border-green-200 rounded-lg font-bold text-lg outline-none focus:border-green-500" placeholder="Ex: 18.5" />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all cursor-pointer">
                    {loading ? 'Processando...' : 'Confirmar Filtragem'}
                </button>
            </form>
        </div>
    </div>
  )
}