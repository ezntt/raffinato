"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CalculadoraRaffinato() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Input agora aceita string livremente para não travar a digitação no celular
  const [litrosInput, setLitrosInput] = useState<string>('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // === ESTADOS DE ESTOQUE ===
  const [estoqueAcucar, setEstoqueAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estoqueAlcool, setEstoqueAlcool] = useState<{id: string, qtd: number} | null>(null)

  // Busca insumos ao carregar
  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data, error } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (error) throw error
        
        if (data) {
            // Lógica flexível para encontrar os itens (ajuste as strings se necessário)
            const acucar = data.find(i => i.nome.toLowerCase().includes('acucar') || i.nome.toLowerCase().includes('açúcar'))
            const alcool = data.find(i => i.nome.toLowerCase().includes('alcool') || i.nome.toLowerCase().includes('álcool') || i.nome.toLowerCase().includes('cereais'))

            if (acucar) setEstoqueAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (alcool) setEstoqueAlcool({ id: alcool.id, qtd: alcool.quantidade_atual })
        }
    } catch (err) {
        console.error("Erro ao buscar estoque:", err)
    }
  }

  // === CONSTANTES ===
  const RAZAO_ALCOOL = 1400 / 4800 
  const RAZAO_XAROPE = 3400 / 4800 

  // Tratamento do Input (Converte vírgula para ponto para cálculo)
  const volumeTotalLitros = Number(litrosInput.replace(',', '.')) || 0
  const volumeTotalMl = volumeTotalLitros * 1000

  // === CÁLCULOS DA RECEITA ===
  const volAlcoolNecessarioMl = volumeTotalMl * RAZAO_ALCOOL
  const volAlcoolNecessarioL = volAlcoolNecessarioMl / 1000

  const volXaropeNecessario = volumeTotalMl * RAZAO_XAROPE

  const volOcupadoPor1KgAcucar = 650 
  const qtdAguaPorKgAcucar = tipo === 'limoncello' ? 2250 : 2500
  const rendimentoXaropePorReceita = volOcupadoPor1KgAcucar + qtdAguaPorKgAcucar

  const kgAcucarNecessarios = volXaropeNecessario / rendimentoXaropePorReceita
  const totalAcucarGramas = kgAcucarNecessarios * 1000
  const totalAguaMl = kgAcucarNecessarios * qtdAguaPorKgAcucar

  const garrafasEstimadas = volumeTotalLitros / 0.75

  // === CÁLCULOS DE PREVISÃO DE ESTOQUE ===
  const saldoAcucar = (estoqueAcucar?.qtd || 0) - kgAcucarNecessarios
  const saldoAlcool = (estoqueAlcool?.qtd || 0) - volAlcoolNecessarioL
  const temInsumos = saldoAcucar >= 0 && saldoAlcool >= 0

  // Função Input Melhorada para Mobile
  const handleChange = (valor: string) => {
    if (/^[\d,.]*$/.test(valor)) {
        setLitrosInput(valor)
    }
  }

  // === AÇÃO: SALVAR LOTE E DESCONTAR ESTOQUE ===
  const handleSalvarLote = async () => {
    if (volumeTotalLitros <= 0) {
      alert("Insira uma quantidade de litros válida.")
      return
    }

    // Validação de Estoque antes de salvar
    if (!temInsumos) {
        const confirmar = window.confirm("⚠️ ATENÇÃO: Seu estoque consta como INSUFICIENTE. Deseja continuar mesmo assim e negativar o estoque?")
        if (!confirmar) return
    } else {
        if (!window.confirm(`Iniciar lote de ${volumeTotalLitros}L de ${tipo}?`)) return
    }

    setLoading(true)

    try {
        // 1. Gerar ID do Lote
        const hoje = new Date()
        const dia = String(hoje.getDate()).padStart(2, '0')
        const mes = String(hoje.getMonth() + 1).padStart(2, '0')
        const ano = String(hoje.getFullYear()).slice(-2)
        const idBase = `${dia}${mes}${ano}`

        let idFinal = idBase
        let contador = 1
        let idDisponivel = false

        while (!idDisponivel) {
            const { data } = await supabase.from('Lote').select('id').eq('id', idFinal).single()
            if (!data) idDisponivel = true
            else {
                contador++
                idFinal = `${idBase}-${contador}`
            }
        }

        const previsao = new Date()
        previsao.setDate(previsao.getDate() + 10)

        // 2. Criar Lote
        const { error: errLote } = await supabase.from('Lote').insert({
            id: idFinal,
            produto: tipo,
            volume_litros: volumeTotalLitros,
            volume_atual: volumeTotalLitros,
            data_inicio: new Date(),
            data_previsao: previsao,
            status: 'em_infusao',
            qtd_garrafas_750: 0,
            qtd_garrafas_375: 0
        })

        if (errLote) throw errLote

        // 3. Descontar Insumos (Se encontrados)
        if (estoqueAcucar) {
            await supabase.from('Insumo')
                .update({ quantidade_atual: saldoAcucar })
                .eq('id', estoqueAcucar.id)
            
            // Log do Açúcar
            await supabase.from('Logs').insert({
                categoria: 'PRODUCAO', acao: 'CONSUMO',
                descricao: `Consumo p/ Lote ${idFinal}: ${kgAcucarNecessarios.toFixed(2)}kg Açúcar`
            })
        }

        if (estoqueAlcool) {
            await supabase.from('Insumo')
                .update({ quantidade_atual: saldoAlcool })
                .eq('id', estoqueAlcool.id)

            // Log do Álcool
            await supabase.from('Logs').insert({
                categoria: 'PRODUCAO', acao: 'CONSUMO',
                descricao: `Consumo p/ Lote ${idFinal}: ${volAlcoolNecessarioL.toFixed(2)}L Álcool`
            })
        }
        
        // Log Geral
        await supabase.from('Logs').insert({
            categoria: 'PRODUCAO', acao: 'INICIO_LOTE',
            descricao: `Iniciou Lote ${idFinal} (${volumeTotalLitros}L ${tipo})`
        })

        alert(`Lote ${idFinal} iniciado e estoques atualizados!`)
        router.push('/lotes')
        
    } catch (error: any) {
        alert("Erro ao salvar: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  // Componente visual de linha de insumo
  const RowEstoque = ({ label, atual, necessario, saldo, unidade }: any) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
        <span className="font-bold text-gray-700">{label}</span>
        <div className="text-right flex flex-col items-end">
            <div className="text-xs text-gray-400">
                Disp: {atual?.toFixed(2)}{unidade}
            </div>
            <div className={`font-bold font-mono ${saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
                -{necessario.toFixed(2)} ➜ {saldo.toFixed(2)}{unidade}
            </div>
        </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Calculadora</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: INPUTS E ESTOQUE */}
        <div className="md:col-span-4 space-y-6">
            
            {/* 1. INPUT */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Planejamento</label>
                
                <div className="mb-6">
                <span className="block text-sm font-bold text-gray-700 mb-2">Produto</span>
                <div className="flex gap-2">
                    <button onClick={() => setTipo('limoncello')} className={`flex-1 py-3 cursor-pointer rounded-lg font-bold transition-all ${tipo === 'limoncello' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Limoncello</button>
                    <button onClick={() => setTipo('arancello')} className={`flex-1 py-3 cursor-pointer rounded-lg font-bold transition-all ${tipo === 'arancello' ? 'bg-orange-400 text-orange-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Arancello</button>
                </div>
                </div>

                <div>
                <span className="block text-sm font-bold text-gray-700 mb-2">Volume Total (Litros)</span>
                <div className="relative">
                    <input 
                    type="text" 
                    inputMode="decimal"
                    placeholder='Ex: 50'
                    value={litrosInput} 
                    onChange={(e) => handleChange(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" 
                    />
                </div>
                </div>
            </div>

            {/* 2. DISPONIBILIDADE DE INSUMOS (NOVO) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Disponibilidade
                </h3>
                {volumeTotalLitros > 0 ? (
                    <div className="space-y-1">
                        <RowEstoque 
                            label="Álcool Cereais" 
                            atual={estoqueAlcool?.qtd || 0} 
                            necessario={volAlcoolNecessarioL} 
                            saldo={saldoAlcool} 
                            unidade="L" 
                        />
                        <RowEstoque 
                            label="Açúcar" 
                            atual={estoqueAcucar?.qtd || 0} 
                            necessario={kgAcucarNecessarios} 
                            saldo={saldoAcucar} 
                            unidade="kg" 
                        />
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

            {/* 3. INFO TÉCNICA (Antigo rodapé da esquerda) */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4 h-fit hidden md:block">
                <h3 className="text-blue-900 font-bold text-sm flex items-center gap-2">
                    ℹ️ Memória de Cálculo
                </h3>
                <ul className="text-xs text-blue-800 space-y-3 opacity-90 leading-relaxed">
                    <li><strong className="text-blue-900">Proporção:</strong> 29% Álcool / 71% Xarope.</li>
                    <li className="border-t border-blue-200 pt-2"><strong className="text-blue-900">Física do Açúcar:</strong> 1kg ocupa 650ml.</li>
                    <li className="border-t border-blue-200 pt-2"><strong className="text-blue-900">Diluição ({tipo}):</strong> 1kg açúcar para {tipo === 'limoncello' ? '2.25L' : '2.50L'} de água.</li>
                </ul>
            </div>
        </div>

        {/* COLUNA DIREITA: RECEITA (Ocupa restante) */}
        <div className="md:col-span-8 bg-gray-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between h-full min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ficha Técnica</h2>
                 <span className="text-xs font-mono text-gray-500 capitalize">{tipo}</span>
              </div>
              
              <div className="space-y-8">
                {/* ÁLCOOL */}
                <div>
                  <p className="text-xs text-yellow-500 font-bold uppercase mb-2">1. Base Alcoólica (29%)</p>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                    <span className="text-gray-300">Álcool de Cereais</span>
                    <span className="text-3xl font-mono font-bold text-yellow-400">
                      {volAlcoolNecessarioL.toFixed(2)} <small className="text-sm text-gray-500">L</small>
                    </span>
                  </div>
                </div>

                {/* XAROPE */}
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase mb-2">2. Preparo do Xarope (71%)</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Água Filtrada</span>
                      <span className="text-3xl font-mono font-bold text-blue-400">
                        {(totalAguaMl / 1000).toFixed(2)} <small className="text-sm text-gray-500">L</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Açúcar Refinado</span>
                      <span className="text-3xl font-mono font-bold text-white">
                        {(totalAcucarGramas / 1000).toFixed(2)} <small className="text-sm text-gray-500">kg</small>
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-700 pb-2 bg-gray-800/50 p-2 rounded">
                      <span className="text-gray-400 text-sm">Volume Xarope</span>
                      <span className="text-xl font-mono font-bold text-gray-200">
                        {(volXaropeNecessario / 1000).toFixed(2)} <small className="text-sm text-gray-500">L</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
               <div className="bg-gray-800 p-4 rounded-xl border border-green-900/50 flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-400 uppercase font-bold">Rendimento (750ml)</span>
                  <span className="text-3xl font-mono font-black text-green-400">
                      ± {garrafasEstimadas.toFixed(0)} <span className="text-lg text-green-600">un</span>
                  </span>
               </div>
               
               <button
                type="button"
                onClick={handleSalvarLote}
                disabled={loading}
                className={`w-full font-bold py-5 rounded-2xl shadow-lg cursor-pointer transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 
                    ${temInsumos ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                {loading ? 'Salvando...' : (temInsumos ? 'Iniciar Produção' : 'Estoque Insuficiente (Forçar)')}
              </button>
            </div>
        </div>

      </div>
    </div>
  )
}