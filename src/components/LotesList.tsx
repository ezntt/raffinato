"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ModalEngarrafar } from './ModalEngarrafar'

export function LotesList({ initialLotes }: { initialLotes: any[] }) {
  const router = useRouter()
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const abrirEngarrafar = (lote: any) => {
    setLoteSelecionado(lote)
    setIsModalOpen(true)
  }

  // Função para mudar o status de 'em_infusao' para 'pronto'
  const liberarLote = async (id: string) => {
    // Confirmação simples
    if (!window.confirm("Deseja aprovar este lote para engarrafamento?")) return

    setLoadingId(id)
    try {
      const { error } = await supabase
        .from('Lote')
        .update({ status: 'pronto' })
        .eq('id', id)

      if (error) throw error
      
      router.refresh()
    } catch (err) {
      alert("Erro ao liberar lote.")
    } finally {
      setLoadingId(null)
    }
  }

  // Função de Excluir Lote (Mantida)
  const excluirLote = async (id: string) => {
    const confirmacao = window.confirm(
        `⛔ PERIGO: Deseja EXCLUIR o lote ${id}?\n\n` +
        `Isso irá reverter a criação, devolvendo o Álcool e o Açúcar para o estoque.\n` +
        `Essa ação não pode ser desfeita.`
    )
    
    if (!confirmacao) return

    setDeletingId(id)
    try {
        const { error } = await supabase.rpc('excluir_lote_reverter', { p_lote_id: id })
        if (error) throw error
        
        alert("Lote excluído e insumos estornados com sucesso!")
        router.refresh()
    } catch (err: any) {
        alert("Erro ao excluir: " + err.message)
    } finally {
        setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {initialLotes.length === 0 && (
          <p className="text-gray-400">Nenhum lote com volume disponível encontrado.</p>
        )}

        {initialLotes.map((lote) => {
          const previsao = new Date(lote.data_previsao)
          const isPronto = lote.status === 'pronto'

          return (
            <div key={lote.id} className="relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
              
              {/* BOTÃO EXCLUIR (Discreto no topo direito) */}
              <button 
                onClick={(e) => { e.stopPropagation(); excluirLote(lote.id) }}
                disabled={deletingId === lote.id}
                className="absolute cursor-pointer top-4 right-4 text-gray-300 hover:text-red-600 font-bold text-xs p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                title="Excluir Lote e Reverter Insumos"
              >
                {deletingId === lote.id ? '⏳' : '🗑️'}
              </button>

              {/* Infos do Lote */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold font-mono">
                    {lote.id}
                  </span>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${lote.produto === 'limoncello' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {lote.produto}
                  </span>
                  
                  {/* Badge de Status Simplificado */}
                  {isPronto ? (
                    <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                      ✓ Aprovado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                      ⏳ Em Infusão
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{lote.volume_atual?.toFixed(1)}L</span>
                  <span className="text-xs text-gray-400 font-bold uppercase">Restantes no Tanque</span>
                </div>
                
                <p className="text-xs text-gray-400 mt-1 flex gap-2">
                  <span>Início: {new Date(lote.data_inicio).toLocaleDateString('pt-BR')}</span>
                  {/* Mantive a previsão visualmente apenas como referência, se quiser */}
                  <span>•</span>
                  <span>Ref: {previsao.toLocaleDateString('pt-BR')}</span>
                </p>
              </div>

              {/* === BOTÕES DE AÇÃO (Sem travas de data) === */}
              <div className="w-full md:w-auto">
                
                {isPronto ? (
                  // Se já está pronto -> Mostra ENGARRAFAR
                  <button
                    onClick={() => abrirEngarrafar(lote)}
                    className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    <span>Engarrafar</span>
                  </button>
                ) : (
                  // Se NÃO está pronto -> Mostra APROVAR (Sempre disponível)
                  <button
                    onClick={() => liberarLote(lote.id)}
                    disabled={loadingId === lote.id}
                    className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 cursor-pointer px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 w-full"
                  >
                    {loadingId === lote.id ? 'Salvando...' : '✅ Aprovar Lote'}
                  </button>
                )}

              </div>

            </div>
          )
        })}
      </div>

      <ModalEngarrafar 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setLoteSelecionado(null) }} 
        lote={loteSelecionado}
      />
    </>
  )
}