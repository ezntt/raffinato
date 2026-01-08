"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { RECEITA } from '@/lib/constants'

export default function ProducaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [loteManual, setLoteManual] = useState<string>('')
  const [litrosInput, setLitrosInput] = useState<string>('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // === ESTADOS DE ESTOQUE ATUALIZADOS ===
  const [estoqueAcucar, setEstoqueAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estoqueBaseL, setEstoqueBaseL] = useState<{id: string, qtd: number} | null>(null)
  const [estoqueBaseA, setEstoqueBaseA] = useState<{id: string, qtd: number} | null>(null)

  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data, error } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (error) throw error
        
        if (data) {
            const acucar = data.find(i => i.nome.toLowerCase().includes('acucar') || i.nome.toLowerCase().includes('açúcar'))
            // Busca exata das bases
            const baseL = data.find(i => i.nome === 'Base Alcoólica Limoncello')
            const baseA = data.find(i => i.nome === 'Base Alcoólica Arancello')

            if (acucar) setEstoqueAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (baseL) setEstoqueBaseL({ id: baseL.id, qtd: baseL.quantidade_atual })
            if (baseA) setEstoqueBaseA({ id: baseA.id, qtd: baseA.quantidade_atual })
        }
    } catch (err) {
        console.error("Erro ao buscar estoque:", err)
    }
  }

  // === CONSTANTES & CÁLCULOS ===
  const volumeTotalLitros = Number(litrosInput.replace(',', '.')) || 0
  const volumeTotalMl = volumeTotalLitros * 1000

  // ÁLCOOL agora é BASE
  const volBaseNecessariaMl = volumeTotalMl * RECEITA.RAZAO_ALCOOL
  const volBaseNecessariaL = volBaseNecessariaMl / 1000

  // XAROPE
  const volXaropeNecessarioMl = volumeTotalMl * RECEITA.RAZAO_XAROPE
  const fatorXarope = tipo === 'limoncello' ? RECEITA.FATOR_XAROPE_LIMONCELLO : RECEITA.FATOR_XAROPE_ARANCELLO
  const fatorAgua = tipo === 'limoncello' ? RECEITA.AGUA_POR_G_ACUCAR_LIMONCELLO : RECEITA.AGUA_POR_G_ACUCAR_ARANCELLO

  const totalAcucarGramas = volXaropeNecessarioMl / fatorXarope
  const kgAcucarNecessarios = totalAcucarGramas / 1000
  const totalAguaMl = totalAcucarGramas * fatorAgua

  const garrafasEstimadas = volumeTotalLitros / 0.75

  // === PREVISÃO DE ESTOQUE (Baseado no tipo selecionado) ===
  const estoqueBaseSelecionada = tipo === 'limoncello' ? estoqueBaseL : estoqueBaseA
  const saldoAcucar = (estoqueAcucar?.qtd || 0) - kgAcucarNecessarios
  const saldoBase = (estoqueBaseSelecionada?.qtd || 0) - volBaseNecessariaL
  const temInsumos = saldoAcucar >= 0 && saldoBase >= 0

  const handleChangeLitros = (valor: string) => {
    if (/^[\d,.]*$/.test(valor)) {
        setLitrosInput(valor)
    }
  }

  const handleSalvarLote = async () => {
    if (!loteManual.trim()) return alert("Digite o número do lote.")
    if (volumeTotalLitros <= 0) return alert("Insira uma quantidade válida.")

    if (!temInsumos) {
        if (!window.confirm("ATENÇÃO: Estoque INSUFICIENTE. Deseja forçar?")) return
    } else {
        if (!window.confirm(`Confirma ${volumeTotalLitros}L de ${tipo}?`)) return
    }

    setLoading(true)

    try {
        const { data: loteExistente } = await supabase.from('Lote').select('*').eq('id', loteManual).maybeSingle()
        const hoje = new Date()
        const novoItemHistorico = { data: hoje.toISOString(), volume: volumeTotalLitros }

        if (loteExistente) {
            if (loteExistente.produto !== tipo) {
                setLoading(false)
                return alert(`ERRO: Lote existente é de ${loteExistente.produto.toUpperCase()}.`)
            }
            const historicoAtual = loteExistente.historico_producao || []
            if (historicoAtual.length === 0 && loteExistente.data_inicio) {
                historicoAtual.push({ data: loteExistente.data_inicio, volume: loteExistente.volume_litros })
            }
            
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

        // === BAIXA DE ESTOQUE (Baseado na Base) ===
        if (estoqueAcucar) {
            await supabase.from('Insumo').update({ quantidade_atual: saldoAcucar }).eq('id', estoqueAcucar.id)
            await supabase.from('Logs').insert({ categoria: 'PRODUCAO', acao: 'CONSUMO', descricao: `Lote ${loteManual}: -${kgAcucarNecessarios.toFixed(2)}kg Açúcar` })
        }

        if (estoqueBaseSelecionada) {
            await supabase.from('Insumo').update({ quantidade_atual: saldoBase }).eq('id', estoqueBaseSelecionada.id)
            await supabase.from('Logs').insert({ categoria: 'PRODUCAO', acao: 'CONSUMO', descricao: `Lote ${loteManual}: -${volBaseNecessariaL.toFixed(2)}L Base ${tipo}` })
        }
        
        await supabase.from('Logs').insert({ categoria: 'PRODUCAO', acao: 'PRODUCAO_LOTE', descricao: `Produziu +${volumeTotalLitros}L de ${tipo} no Lote ${loteManual}` })

        alert("Sucesso!")
        router.push('/lotes')
        
    } catch (error: any) {
        alert("Erro: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  const RowEstoque = ({ label, atual, necessario, saldo, unidade }: any) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
        <span className="font-bold text-gray-700">{label}</span>
        <div className="text-right flex flex-col items-end">
            <div className="text-xs text-gray-400">Disp: {atual?.toFixed(2)}{unidade}</div>
            <div className={`font-bold font-mono ${saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>-{necessario.toFixed(2)} ➜ {saldo.toFixed(2)}{unidade}</div>
        </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8"><h1 className="text-3xl font-black text-gray-900 tracking-tight">Produção</h1></header>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
                        <div className="border-blue-200 text-[10px] text-blue-500 font-bold text-center uppercase tracking-wider">29,17% Base • 70,83% Xarope</div>
                    </div>
                </div>
                <div className="mb-6">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Nº do Lote</span>
                    <input type="text" placeholder='Ex: 050126' value={loteManual} onChange={(e) => setLoteManual(e.target.value.toUpperCase())} className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-black rounded-xl text-lg font-bold text-gray-900 outline-none" />
                </div>
                <div>
                    <span className="block text-sm font-bold text-gray-700 mb-2">Volume (Litros)</span>
                    <input type="text" inputMode="decimal" placeholder='Ex: 50' value={litrosInput} onChange={(e) => handleChangeLitros(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl text-4xl font-black text-gray-900 outline-none" />
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">Disponibilidade</h3>
                {volumeTotalLitros > 0 ? (
                    <div className="space-y-1">
                        <RowEstoque label={`Base ${tipo === 'limoncello' ? 'Limoncello' : 'Arancello'}`} atual={estoqueBaseSelecionada?.qtd || 0} necessario={volBaseNecessariaL} saldo={saldoBase} unidade="L" />
                        <RowEstoque label="Açúcar" atual={estoqueAcucar?.qtd || 0} necessario={kgAcucarNecessarios} saldo={saldoAcucar} unidade="kg" />
                        {!temInsumos && (<div className="mt-3 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded text-center uppercase tracking-wide">Estoque Insuficiente</div>)}
                    </div>
                ) : (<p className="text-sm text-gray-400 italic">Digite o volume.</p>)}
            </div>
        </div>
        <div className="md:col-span-8 bg-gray-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between h-full min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6"><h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ficha Técnica</h2><span className="text-xs font-mono text-gray-500 capitalize">{loteManual ? `Lote: ${loteManual}` : 'Novo Lote'}</span></div>
              <div className="space-y-8">
                <div>
                  <p className="text-xs text-yellow-500 font-bold uppercase mb-2">1. Base Alcoólica ({(RECEITA.RAZAO_ALCOOL * 100).toFixed(2)}%)</p>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2"><span className="text-gray-300">Base {tipo === 'limoncello' ? 'Limoncello' : 'Arancello'}</span><span className="text-3xl font-mono font-bold text-yellow-400">{volBaseNecessariaL.toFixed(2)} <small className="text-sm text-gray-500">L</small></span></div>
                </div>
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase mb-2">2. Xarope ({(RECEITA.RAZAO_XAROPE * 100).toFixed(2)}%)</p>
                  <div className="space-y-4">
                    {/* NOVO: VOLTOU O VALOR TOTAL DO XAROPE */}

                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Água</span>
                      <span className="text-3xl font-mono font-bold text-blue-400">
                        {(totalAguaMl / 1000).toFixed(2)} <small className="text-sm text-gray-500">L</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Açúcar</span>
                      <span className="text-3xl font-mono font-bold text-white">
                        {kgAcucarNecessarios.toFixed(2)} <small className="text-sm text-gray-500">kg</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2 bg-blue-900/20 px-2 rounded">
                        <span className="text-blue-200">Volume de Calda/Xarope</span>
                        <span className="text-xl font-mono font-bold text-blue-200">
                            {(volXaropeNecessarioMl / 1000).toFixed(2)} <small className="text-sm text-gray-400">L</small>
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-700">
               <div className="bg-gray-800 p-4 rounded-xl border border-green-900/50 flex justify-between items-center mb-4"><span className="text-xs text-gray-400 uppercase font-bold">Rendimento</span><span className="text-3xl font-mono font-black text-green-400">± {garrafasEstimadas.toFixed(0)} <span className="text-lg text-green-600">garrafas</span></span></div>
               <button type="button" onClick={handleSalvarLote} disabled={loading} className={`w-full font-bold py-5 rounded-2xl shadow-lg cursor-pointer transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 ${temInsumos ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>{loading ? 'Salvando...' : (temInsumos ? 'Confirmar Produção' : 'Estoque Insuficiente (Forçar)')}</button>
            </div>
        </div>
      </div>
    </div>
  )
}