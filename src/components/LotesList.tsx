"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ModalEngarrafar } from './ModalEngarrafar'
import { ModalMaceracao } from './ModalMaceracao'
import { ModalFiltrar } from './ModalFiltrar'
import { NOME_INSUMO } from '@/lib/constants'

export function LotesList({ initialLotes }: { initialLotes: any[] }) {
  const router = useRouter()
  
  // Modais
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null)
  const [isEngarrafarOpen, setIsEngarrafarOpen] = useState(false)
  const [isMaceracaoOpen, setIsMaceracaoOpen] = useState(false)
  
  const [filtrarOpen, setFiltrarOpen] = useState(false)
  const [tipoFiltrar, setTipoFiltrar] = useState<'limoncello' | 'arancello'>('limoncello')

  // --- NOVO: Estado de Edição ---
  const [isEditing, setIsEditing] = useState(false)

  // Loading States
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Dados das Bases (Buscados no Client para ter atualização real)
  const [bases, setBases] = useState<any>({
      limoncelloCasca: 0, limoncelloFiltrada: 0,
      arancelloCasca: 0, arancelloFiltrada: 0
  })

  useEffect(() => {
    fetchBases()
  }, [initialLotes]) 

  const fetchBases = async () => {
    const { data } = await supabase.from('Insumo').select('nome, quantidade_atual')
    if(data) {
        const getQtd = (nome: string) => data.find(i => i.nome === nome)?.quantidade_atual || 0
        setBases({
            limoncelloCasca: getQtd(NOME_INSUMO.BASE_LIMONCELLO_CASCA),
            limoncelloFiltrada: getQtd(NOME_INSUMO.BASE_LIMONCELLO_FILTRADA),
            arancelloCasca: getQtd(NOME_INSUMO.BASE_ARANCELLO_CASCA),
            arancelloFiltrada: getQtd(NOME_INSUMO.BASE_ARANCELLO_FILTRADA),
        })
    }
  }

  const abrirEngarrafar = (lote: any) => {
    setLoteSelecionado(lote)
    setIsEngarrafarOpen(true)
  }
  
  const abrirFiltrar = (tipo: 'limoncello' | 'arancello') => {
      setTipoFiltrar(tipo)
      setFiltrarOpen(true)
  }

  // --- LÓGICA DE LOTES EXISTENTE ---
  const liberarLote = async (id: string) => {
    if (!window.confirm("Deseja aprovar este lote para engarrafamento?")) return
    setLoadingId(id)
    try {
      const { error } = await supabase.from('Lote').update({ status: 'pronto' }).eq('id', id)
      if (error) throw error
      router.refresh()
    } catch (err) { alert("Erro ao liberar lote.") } finally { setLoadingId(null) }
  }

  const excluirLote = async (id: string) => {
    if (!window.confirm(`Deseja EXCLUIR o lote ${id}? Isso estorna os insumos.`)) return
    setDeletingId(id)
    try {
        const { error } = await supabase.rpc('excluir_lote_reverter', { p_lote_id: id })
        if (error) throw error
        alert("Lote excluído.")
        router.refresh()
    } catch (err: any) { alert("Erro: " + err.message) } finally { setDeletingId(null) }
  }

  // --- NOVAS FUNÇÕES DE ATUALIZAÇÃO MANUAL ---

  // Atualiza Base (Insumo)
  const handleUpdateBase = async (nomeInsumo: string, novaQtd: number) => {
    try {
        await supabase.from('Insumo').update({ quantidade_atual: novaQtd }).eq('nome', nomeInsumo)
        await supabase.from('Logs').insert({
            categoria: 'ESTOQUE',
            acao: 'AJUSTE_MANUAL',
            descricao: `Ajuste manual em ${nomeInsumo} para ${novaQtd}L`
        })
        fetchBases() // Atualiza localmente
    } catch (error) {
        alert("Erro ao atualizar base.")
    }
  }

  // Atualiza Volume do Lote (Lote)
  const handleUpdateLoteVolume = async (id: string, novoVolume: number) => {
    try {
        await supabase.from('Lote').update({ volume_atual: novoVolume }).eq('id', id)
        await supabase.from('Logs').insert({
            categoria: 'PRODUCAO',
            acao: 'AJUSTE_MANUAL',
            descricao: `Ajuste manual no Lote ${id} para ${novoVolume}L`
        })
        router.refresh()
    } catch (error) {
        alert("Erro ao atualizar lote.")
    }
  }

  // --- SUB-COMPONENTS (Para gerenciar estado individual dos inputs) ---

  const BaseCard = ({ tipo, casca, filtrada, cor, icone }: any) => {
      // Estado local para input
      const [localFiltrada, setLocalFiltrada] = useState(filtrada)
      
      // Sincroniza props
      useEffect(() => { setLocalFiltrada(filtrada) }, [filtrada])

      const nomeInsumoFiltrada = tipo === 'Limoncello' 
        ? NOME_INSUMO.BASE_LIMONCELLO_FILTRADA 
        : NOME_INSUMO.BASE_ARANCELLO_FILTRADA

      const onBlurSave = () => {
          if (localFiltrada === filtrada) return
          handleUpdateBase(nomeInsumoFiltrada, Number(localFiltrada))
      }

      return (
        <div className={`p-5 rounded-2xl border flex-1 ${cor} flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icone}</span>
                    <h3 className="font-bold text-lg tracking-tight">{tipo}</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Coluna COM CASCA (Apenas visual/filtrar por enquanto) */}
                <div className="bg-white/60 p-3 rounded-xl border border-black/5">
                    <span className="text-[10px] font-bold uppercase opacity-60 block">Em Maceração (Com Casca)</span>
                    <span className="text-2xl font-black block my-1">{casca.toFixed(2)} L</span>
                    {casca > 0 && !isEditing && (
                        <button onClick={() => abrirFiltrar(tipo.toLowerCase())} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold w-full hover:opacity-80 transition-all ">
                            ➔ Filtrar
                        </button>
                    )}
                </div>

                {/* Coluna FILTRADA (Editável) */}
                <div className="bg-white p-3 rounded-xl border border-black/5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase opacity-60 block">Base Pronta (Filtrada)</span>
                    
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <input 
                                type="number" 
                                step="0.1"
                                value={localFiltrada}
                                onChange={(e) => setLocalFiltrada(e.target.value)}
                                onBlur={onBlurSave}
                                onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
                                className="w-full p-1 font-black text-xl text-gray-900 border-b-2 border-yellow-400 bg-yellow-50 outline-none focus:border-black rounded placeholder-gray-500"
                            />
                            <span className="text-xs font-bold text-gray-400">L</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-black block my-1">{filtrada.toFixed(2)} L</span>
                    )}
                    
                    <span className="text-[10px] text-gray-400 font-bold block">Disponível para Lotes</span>
                </div>
            </div>
        </div>
      )
  }

  const LoteItem = ({ lote }: { lote: any }) => {
      // Estado local para o volume
      const [localVolume, setLocalVolume] = useState(lote.volume_atual)
      
      useEffect(() => { setLocalVolume(lote.volume_atual) }, [lote.volume_atual])

      const onBlurSave = () => {
          if (localVolume === lote.volume_atual) return
          handleUpdateLoteVolume(lote.id, Number(localVolume))
      }

      const previsao = new Date(lote.data_previsao)
      const isPronto = lote.status === 'pronto'
      const historico = lote.historico_producao || []
      const dataInicialReal = historico.length > 0 
          ? new Date(historico[0].data).toLocaleDateString('pt-BR') 
          : new Date(lote.data_inicio).toLocaleDateString('pt-BR')

      return (
        <div className="relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
            <button 
                onClick={(e) => { e.stopPropagation(); excluirLote(lote.id) }}
                disabled={deletingId === lote.id}
                className="absolute  top-4 right-4 text-gray-300 hover:text-red-600 font-bold text-xs p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
                {deletingId === lote.id ? '⏳' : '🗑️'}
            </button>

            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold font-mono">{lote.id}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${lote.produto === 'limoncello' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>{lote.produto}</span>
                    {isPronto ? (
                        <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">✓ Aprovado</span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">⏳ Em Infusão</span>
                    )}
                </div>
                
                <div className="flex items-baseline gap-2">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                             <input 
                                type="number" 
                                step="0.1"
                                value={localVolume}
                                onChange={(e) => setLocalVolume(e.target.value)}
                                onBlur={onBlurSave}
                                onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
                                className="w-32 p-1 font-black text-3xl text-gray-900 border-b-2 border-yellow-400 bg-yellow-50 outline-none focus:border-black rounded placeholder-gray-500"
                            />
                            <span className="text-xs font-bold text-gray-400">L</span>
                        </div>
                    ) : (
                        <span className="text-3xl font-black text-gray-900">{lote.volume_atual?.toFixed(1)}L</span>
                    )}
                    {!isEditing && <span className="text-xs text-gray-400 font-bold uppercase">Restantes</span>}
                </div>

                <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400 flex gap-2">
                        <span>Início: {dataInicialReal}</span>
                        <span>•</span>
                        <span>Prev: {previsao.toLocaleDateString('pt-BR')}</span>
                    </p>
                </div>
            </div>

            <div className="w-full md:w-auto">
                {isPronto ? (
                <button onClick={() => abrirEngarrafar(lote)} className="bg-blue-600  hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all w-full">Engarrafar</button>
                ) : (
                <button onClick={() => liberarLote(lote.id)} disabled={loadingId === lote.id} className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-50  px-6 py-3 rounded-xl font-bold text-sm transition-all w-full">{loadingId === lote.id ? 'Salvando...' : '✅ Aprovar Lote'}</button>
                )}
            </div>
        </div>
      )
  }

  return (
    <>
      <div className="space-y-8">
        
        {/* SEÇÃO SUPERIOR: DASHBOARD DE MACERAÇÃO */}
        <section>
            <div className="flex justify-between items-end mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-gray-900">Maceração & Bases</h2>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 justify-center border-2 
                        ${isEditing 
                            ? 'bg-yellow-400 border-yellow-500 text-yellow-900' 
                            : 'bg-white border-gray-200 text-gray-400 hover:text-black hover:border-black'
                        }`}
                    >
                        {isEditing ? 'Concluir Edição' : 'Ajuste Manual'}
                    </button>
                </div>

                <button onClick={() => setIsMaceracaoOpen(true)} className="bg-black  hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 w-full md:w-auto justify-center">
                    + Nova Maceração
                </button>
            </div>

            {isEditing && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-center text-sm font-bold animate-pulse mb-6">
                    Modo de Edição Ativo: Altere os valores de Bases Filtradas ou Volumes de Lotes.
                </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4">
                <BaseCard 
                    tipo="Limoncello" 
                    icone="🍋"
                    casca={bases.limoncelloCasca} 
                    filtrada={bases.limoncelloFiltrada} 
                    cor="bg-yellow-50 border-yellow-200 text-yellow-900"
                />
                <BaseCard 
                    tipo="Arancello" 
                    icone="🍊"
                    casca={bases.arancelloCasca} 
                    filtrada={bases.arancelloFiltrada} 
                    cor="bg-orange-50 border-orange-200 text-orange-900"
                />
            </div>
        </section>

        {/* DIVISÓRIA */}
        <hr className="border-gray-100" />

        {/* SEÇÃO INFERIOR: LOTES */}
        <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">Lotes em Maturação</h2>
            
            {initialLotes.length === 0 && (
            <p className="text-gray-400">Nenhum lote criado ainda.</p>
            )}

            <div className="space-y-4">
                {initialLotes.map((lote) => (
                    <LoteItem key={lote.id} lote={lote} />
                ))}
            </div>
        </section>
      </div>

      <ModalEngarrafar isOpen={isEngarrafarOpen} onClose={() => { setIsEngarrafarOpen(false); setLoteSelecionado(null) }} lote={loteSelecionado} />
      
      <ModalMaceracao isOpen={isMaceracaoOpen} onClose={() => { setIsMaceracaoOpen(false); fetchBases() }} />
      
      <ModalFiltrar isOpen={filtrarOpen} onClose={() => { setFiltrarOpen(false); fetchBases() }} tipoInicial={tipoFiltrar} />
    </>
  )
}