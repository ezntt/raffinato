"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { RECEITA } from '@/lib/constants'

export function CalculadoraLicor() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Inputs
  const [loteManual, setLoteManual] = useState('')
  const [litrosInput, setLitrosInput] = useState('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // Estoques
  const [estoqueAcucar, setEstoqueAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estoqueBaseL, setEstoqueBaseL] = useState<{id: string, qtd: number} | null>(null)
  const [estoqueBaseA, setEstoqueBaseA] = useState<{id: string, qtd: number} | null>(null)

  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (data) {
            const acucar = data.find(i => i.nome.toLowerCase().includes('acucar') || i.nome.toLowerCase().includes('açúcar'))
            const baseL = data.find(i => i.nome === 'Base Alcoólica Limoncello')
            const baseA = data.find(i => i.nome === 'Base Alcoólica Arancello')

            if (acucar) setEstoqueAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (baseL) setEstoqueBaseL({ id: baseL.id, qtd: baseL.quantidade_atual })
            if (baseA) setEstoqueBaseA({ id: baseA.id, qtd: baseA.quantidade_atual })
        }
    } catch (err) { console.error(err) }
  }

  // === CÁLCULOS ===
  const volumeTotalLitros = Number(litrosInput.replace(',', '.')) || 0
  const volumeTotalMl = volumeTotalLitros * 1000

  // 1. Base (29,17%)
  const volBaseNecessariaMl = volumeTotalMl * RECEITA.RAZAO_ALCOOL
  const volBaseNecessariaL = volBaseNecessariaMl / 1000

  // 2. Xarope (70,83%)
  const volXaropeNecessarioMl = volumeTotalMl * RECEITA.RAZAO_XAROPE

  // Decomposição Xarope
  const fatorXarope = tipo === 'limoncello' ? RECEITA.FATOR_XAROPE_LIMONCELLO : RECEITA.FATOR_XAROPE_ARANCELLO
  const fatorAgua = tipo === 'limoncello' ? RECEITA.AGUA_POR_G_ACUCAR_LIMONCELLO : RECEITA.AGUA_POR_G_ACUCAR_ARANCELLO

  const totalAcucarGramas = volXaropeNecessarioMl / fatorXarope
  const kgAcucarNecessarios = totalAcucarGramas / 1000
  const totalAguaMl = totalAcucarGramas * fatorAgua

  const garrafasEstimadas = volumeTotalLitros / 0.75

  // Validação Estoque
  const estoqueBaseSelecionada = tipo === 'limoncello' ? estoqueBaseL : estoqueBaseA
  const saldoAcucar = (estoqueAcucar?.qtd || 0) - kgAcucarNecessarios
  const saldoBase = (estoqueBaseSelecionada?.qtd || 0) - volBaseNecessariaL
  const temInsumos = saldoAcucar >= 0 && saldoBase >= 0

  const handleSalvarLote = async () => {
    if (!loteManual.trim()) return alert("Digite o NÚMERO DO LOTE.")
    if (volumeTotalLitros <= 0) return alert("Insira uma quantidade válida.")

    if (!temInsumos) {
        if (!window.confirm("ATENÇÃO: Estoque INSUFICIENTE. Deseja continuar mesmo assim e negativar o estoque?")) return
    } else {
        if (!window.confirm(`Confirma a produção de ${volumeTotalLitros}L de ${tipo} para o lote ${loteManual}?`)) return
    }

    setLoading(true)

    try {
        const { data: loteExistente } = await supabase.from('Lote').select('*').eq('id', loteManual).maybeSingle()
        const hoje = new Date()
        const novoItemHistorico = { data: hoje.toISOString(), volume: volumeTotalLitros }

        if (loteExistente) {
            if (loteExistente.produto !== tipo) {
                setLoading(false)
                return alert(`ERRO: O Lote ${loteManual} já existe mas é de ${loteExistente.produto.toUpperCase()}.`)
            }
            
            const historicoAtual = loteExistente.historico_producao || []
            await supabase.from('Lote').update({ 
                volume_litros: (loteExistente.volume_litros || 0) + volumeTotalLitros,
                volume_atual: (loteExistente.volume_atual || 0) + volumeTotalLitros,
                historico_producao: [...historicoAtual, novoItemHistorico],
                status: 'em_infusao', 
                data_previsao: new Date(hoje.setDate(hoje.getDate() + 10))
            }).eq('id', loteManual)

        } else {
            const previsao = new Date()
            previsao.setDate(previsao.getDate() + 10)

            await supabase.from('Lote').insert({
                id: loteManual, produto: tipo, volume_litros: volumeTotalLitros, volume_atual: volumeTotalLitros,
                data_inicio: new Date(), data_previsao: previsao, status: 'em_infusao',
                qtd_garrafas_750: 0, qtd_garrafas_375: 0, historico_producao: [novoItemHistorico]
            })
        }

        // Baixa Estoque
        if (estoqueAcucar) await supabase.rpc('decrement_estoque', { p_id: estoqueAcucar.id, p_qtd: kgAcucarNecessarios })
        if (estoqueBaseSelecionada) await supabase.rpc('decrement_estoque', { p_id: estoqueBaseSelecionada.id, p_qtd: volBaseNecessariaL })
        
        await supabase.from('Logs').insert({ categoria: 'PRODUCAO', acao: 'PRODUCAO_LOTE', descricao: `Produziu +${volumeTotalLitros}L de ${tipo} no Lote ${loteManual}` })

        alert(`Produção registrada no Lote ${loteManual} com sucesso!`)
        router.push('/lotes')
        
    } catch (error: any) {
        alert("Erro ao salvar: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  const RowEstoque = ({ label, atual, necessario, saldo, unidade }: any) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
        <span className="font-bold text-gray-700">{label}</span>
        <div className="text-right flex flex-col items-end">
            <div className="text-xs text-gray-400">Disp: {atual?.toFixed(2)}{unidade}</div>
            <div className={`font-bold font-mono ${saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
                -{necessario.toFixed(2)} ➜ {saldo.toFixed(2)}{unidade}
            </div>
        </div>
    </div>
  )

  return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* COLUNA ESQUERDA: INPUTS E ESTOQUE */}
        <div className="md:col-span-4 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Planejamento</label>
                
                <div className="mb-6">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Produto</span>
                    <div className="flex gap-2">
                        <button onClick={() => setTipo('limoncello')} className={`flex-1 py-3 cursor-pointer rounded-lg font-bold transition-all ${tipo === 'limoncello' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Limoncello</button>
                        <button onClick={() => setTipo('arancello')} className={`flex-1 py-3 cursor-pointer rounded-lg font-bold transition-all ${tipo === 'arancello' ? 'bg-orange-400 text-orange-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Arancello</button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-3 shadow-sm">
                        <div className="border-blue-200 text-[10px] text-blue-500 font-bold text-center uppercase tracking-wider">
                            29,17% Base • 70,83% Xarope
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <span className="block text-sm font-bold text-gray-700 mb-2">
                        Nº do Lote (Data Compra)
                    </span>
                    <input 
                        type="text" 
                        placeholder='Ex: 050126'
                        value={loteManual}
                        onChange={(e) => setLoteManual(e.target.value.toUpperCase())}
                        className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded-xl text-lg font-bold text-gray-900 outline-none transition-all placeholder:font-normal" 
                    />
                </div>

                <div>
                    <span className="block text-sm font-bold text-gray-700 mb-2">Volume a Produzir (Litros)</span>
                    <div className="relative">
                        <input 
                            type="text" 
                            inputMode="decimal"
                            placeholder='0'
                            value={litrosInput} 
                            onChange={(e) => setLitrosInput(e.target.value)} 
                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Disponibilidade
                </h3>
                {volumeTotalLitros > 0 ? (
                    <div className="space-y-1">
                        <RowEstoque label={`Base ${tipo}`} atual={estoqueBaseSelecionada?.qtd || 0} necessario={volBaseNecessariaL} saldo={saldoBase} unidade="L" />
                        <RowEstoque label="Açúcar" atual={estoqueAcucar?.qtd || 0} necessario={kgAcucarNecessarios} saldo={saldoAcucar} unidade="kg" />
                        {!temInsumos && (
                             <div className="mt-3 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded text-center uppercase tracking-wide">
                                 Estoque Insuficiente
                             </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">Digite o volume para calcular o estoque.</p>
                )}
            </div>
        </div>

        {/* COLUNA DIREITA: FICHA TÉCNICA (AGORA COM FUNDO PADRÃO) */}
        <div className="md:col-span-8 bg-white text-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ficha Técnica</h2>
                 <span className="text-xs font-mono text-gray-400 capitalize">{loteManual ? `Lote: ${loteManual}` : 'Novo Lote'}</span>
              </div>
              
              <div className="space-y-8">
                <div>
                  <p className="text-xs text-yellow-600 font-bold uppercase mb-2">1. Base Alcoólica ({(RECEITA.RAZAO_ALCOOL * 100).toFixed(2)}%)</p>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Base {tipo === 'limoncello' ? 'Limoncello' : 'Arancello'}</span>
                    <span className="text-3xl font-mono font-bold text-gray-900">
                      {volBaseNecessariaL.toFixed(2)} <small className="text-sm text-gray-400">L</small>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase mb-2">2. Preparo do Xarope ({(RECEITA.RAZAO_XAROPE * 100).toFixed(2)}%)</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Água Filtrada</span>
                      <span className="text-3xl font-mono font-bold text-gray-900">
                        {(totalAguaMl / 1000).toFixed(2)} <small className="text-sm text-gray-400">L</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Açúcar Refinado</span>
                      <span className="text-3xl font-mono font-bold text-gray-900">
                        {kgAcucarNecessarios.toFixed(2)} <small className="text-sm text-gray-400">kg</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-100 pb-2 bg-gray-50 px-2 rounded">
                        <span className="text-blue-600 font-bold text-sm">Volume de Calda/Xarope</span>
                        <span className="text-xl font-mono font-bold text-blue-600">
                            {(volXaropeNecessarioMl / 1000).toFixed(2)} <small className="text-sm text-blue-400">L</small>
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-400 uppercase font-bold">Rendimento Estimado</span>
                  <span className="text-3xl font-mono font-black text-green-600">
                      ± {garrafasEstimadas.toFixed(0)} <span className="text-lg text-green-700">garrafas</span>
                  </span>
               </div>
               
               <button
                type="button"
                onClick={handleSalvarLote}
                disabled={loading}
                className={`w-full font-bold py-5 rounded-2xl shadow-lg cursor-pointer transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 
                    ${temInsumos ? 'bg-black hover:bg-gray-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                {loading ? 'Salvando...' : (temInsumos ? 'Confirmar Produção' : 'Estoque Insuficiente (Forçar)')}
              </button>
            </div>
        </div>
      </div>
  )
}