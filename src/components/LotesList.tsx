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

  const abrirEngarrafar = (lote: any) => {
    setLoteSelecionado(lote)
    setIsModalOpen(true)
  }

  // Função para mudar o status de 'em_infusao' para 'pronto'
  const liberarLote = async (id: string) => {
    const confirm = window.confirm("Confirma que este lote passou no teste de qualidade e pode ser engarrafado?")
    if (!confirm) return

    setLoadingId(id)
    try {
      const { error } = await supabase
        .from('Lote')
        .update({ status: 'pronto' })
        .eq('id', id)

      if (error) throw error
      
      router.refresh() // Atualiza a tela para mostrar o botão de engarrafar
    } catch (err) {
      alert("Erro ao liberar lote.")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {initialLotes.length === 0 && (
          <p className="text-gray-400">Nenhum lote com volume disponível encontrado.</p>
        )}

        {initialLotes.map((lote) => {
          // AINDA precisamos checar a data para SUGERIR a liberação, 
          // mas o engarrafamento dependerá estritamente do STATUS.
          const hoje = new Date()
          const previsao = new Date(lote.data_previsao)
          hoje.setHours(0, 0, 0, 0)
          previsao.setHours(0, 0, 0, 0)

          const dataVenceu = hoje >= previsao
          const isPronto = lote.status === 'pronto' // Agora confiamos no banco!

          // Calcula dias restantes (visual)
          const diffTime = Math.abs(previsao.getTime() - hoje.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 

          return (
            <div key={lote.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              {/* Infos do Lote */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold font-mono">
                    {lote.id}
                  </span>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${lote.produto === 'limoncello' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {lote.produto}
                  </span>
                  
                  {/* Badge de Status Baseado no Banco */}
                  {isPronto ? (
                    <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                      ✓ Aprovado
                    </span>
                  ) : dataVenceu ? (
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 animate-pulse">
                      🔔 Aguardando Análise
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                      ⏳ Maturando
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{lote.volume_atual?.toFixed(1)}L</span>
                  <span className="text-xs text-gray-400 font-bold uppercase">Restantes no Tanque</span>
                </div>
                
                <p className="text-xs text-gray-400 mt-1 flex gap-2">
                  <span>Início: {new Date(lote.data_inicio).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span>Previsão: {previsao.toLocaleDateString('pt-BR')}</span>
                </p>
              </div>

              {/* === LÓGICA DE BOTÕES INTELIGENTES === */}
              <div className="w-full md:w-auto">
                
                {/* CENÁRIO 1: Está pronto no banco? -> ENGARRAFAR */}
                {isPronto && (
                  <button
                    onClick={() => abrirEngarrafar(lote)}
                    className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    <span>🍾 Engarrafar</span>
                  </button>
                )}

                {/* CENÁRIO 2: Data venceu mas não está pronto? -> LIBERAR */}
                {!isPronto && dataVenceu && (
                  <button
                    onClick={() => liberarLote(lote.id)}
                    disabled={loadingId === lote.id}
                    className="bg-green-500 hover:bg-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    {loadingId === lote.id ? 'Salvando...' : '✅ Aprovar Lote'}
                  </button>
                )}

                {/* CENÁRIO 3: Data não venceu? -> ESPERAR */}
                {!isPronto && !dataVenceu && (
                  <button
                    disabled
                    className="bg-gray-100 text-gray-400 border border-gray-200 px-6 py-3 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 w-full"
                  >
                    <span>✋ Falta(m) {diffDays} dia(s)</span>
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