"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CalculadoraRaffinato() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Input agora aceita string livremente para não travar a digitação no celular
  const [litrosInput, setLitrosInput] = useState<string>('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // === CONSTANTES ===
  const RAZAO_ALCOOL = 1400 / 4800 
  const RAZAO_XAROPE = 3400 / 4800 

  // Tratamento do Input (Converte vírgula para ponto para cálculo)
  const volumeTotalLitros = Number(litrosInput.replace(',', '.')) || 0
  const volumeTotalMl = volumeTotalLitros * 1000

  // === CÁLCULOS ===
  const volAlcoolNecessario = volumeTotalMl * RAZAO_ALCOOL
  const volXaropeNecessario = volumeTotalMl * RAZAO_XAROPE

  const volOcupadoPor1KgAcucar = 650 
  const qtdAguaPorKgAcucar = tipo === 'limoncello' ? 2250 : 2500
  const rendimentoXaropePorReceita = volOcupadoPor1KgAcucar + qtdAguaPorKgAcucar

  const kgAcucarNecessarios = volXaropeNecessario / rendimentoXaropePorReceita
  const totalAcucarGramas = kgAcucarNecessarios * 1000
  const totalAguaMl = kgAcucarNecessarios * qtdAguaPorKgAcucar

  const garrafasEstimadas = volumeTotalLitros / 0.75

  // Função Input Melhorada para Mobile
  const handleChange = (valor: string) => {
    // Permite digitar números e vírgulas/pontos livremente
    if (/^[\d,.]*$/.test(valor)) {
        setLitrosInput(valor)
    }
  }

  // === AÇÃO: SALVAR LOTE ===
  const handleSalvarLote = async () => {
    if (volumeTotalLitros <= 0) {
      alert("Insira uma quantidade de litros válida.")
      return
    }

    if (!window.confirm(`Iniciar lote de ${volumeTotalLitros}L de ${tipo}?`)) return

    setLoading(true)

    try {
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

        const { error } = await supabase.from('Lote').insert({
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

        if (error) throw error

        alert(`Lote ${idFinal} iniciado!`)
        router.push('/lotes')
        
    } catch (error: any) {
        alert("Erro ao salvar: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Calculadora</h1>
      </header>

      {/* Grid reorganizado: No mobile segue a ordem do HTML (Input -> Receita -> Info) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 1. INPUT (Esquerda no PC, Topo no Mobile) */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
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
                  inputMode="decimal" // Teclado numérico no celular
                  placeholder='Ex: 50'
                  value={litrosInput} 
                  onChange={(e) => handleChange(e.target.value)} 
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" 
                />
              </div>
            </div>
        </div>

        {/* 2. RECEITA (Direita no PC, Meio no Mobile) - row-span-2 faz ela ocupar a altura toda à direita */}
        <div className="md:col-span-8 md:row-span-2 bg-gray-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between h-full">
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
                      {(volAlcoolNecessario / 1000).toFixed(2)} <small className="text-sm text-gray-500">L</small>
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
                    {/* INSERIDO VOLTA DO XAROPE */}
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-2xl shadow-lg cursor-pointer transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Iniciar Produção'}
              </button>
            </div>
        </div>

        {/* 3. INFO TÉCNICA (Esquerda/Baixo no PC, Fundo no Mobile) */}
        <div className="md:col-span-4 bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4 h-fit">
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
    </div>
  )
}