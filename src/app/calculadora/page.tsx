"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Certifique-se que o caminho está certo
import { useRouter } from 'next/navigation'

export default function CalculadoraRaffinato() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Inputs
  const [qtdInput750, setQtdInput750] = useState<number | string>(1)
  const [qtdInput375, setQtdInput375] = useState<number | string>('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // === CONSTANTES E PROPORÇÕES ===
  const PCT_ALCOOL = 1400 / 4800
  const PCT_XAROPE = 3400 / 4800

  // Tratamento dos Inputs
  const qtdGarrafas750 = Number(qtdInput750) || 0
  const qtdGarrafas375 = Number(qtdInput375) || 0

  // === CÁLCULOS ===
  const volTotalProducao = (750 * qtdGarrafas750) + (375 * qtdGarrafas375)
  const volAlcoolNecessario = volTotalProducao * PCT_ALCOOL
  const volXaropeNecessario = volTotalProducao * PCT_XAROPE

  const volOcupadoPor1KgAcucar = 650
  const qtdAguaPorKgAcucar = tipo === 'limoncello' ? 2250 : 2500
  const rendimentoXaropePorReceita = volOcupadoPor1KgAcucar + qtdAguaPorKgAcucar

  const kgAcucarNecessarios = volXaropeNecessario / rendimentoXaropePorReceita

  const totalAcucarGramas = kgAcucarNecessarios * 1000
  const totalAguaMl = kgAcucarNecessarios * qtdAguaPorKgAcucar

  // Função auxiliar input
  const handleChange = (valor: string, setFn: any) => {
    if (valor === '') { setFn(''); return }
    const numero = parseFloat(valor)
    if (!isNaN(numero) && numero >= 0) setFn(numero)
  }

  // === AÇÃO: SALVAR NO BANCO DE DADOS ===
  // === AÇÃO: SALVAR NO BANCO DE DADOS (COM VERIFICAÇÃO DE DUPLICIDADE) ===
  const handleSalvarLote = async () => {
    if (volTotalProducao <= 0) {
      alert("Insira pelo menos uma garrafa para produzir.")
      return
    }

    const confirmacao = window.confirm(
      `Confirma o início da produção de um novo lote?\n\n` +
      `Isso irá gerar o Lote ID baseada na data de hoje e iniciar a contagem de 10 dias de infusão.`
    )

    if (!confirmacao) return

    setLoading(true)

    // 1. Gerar ID Base (DDMMYY)
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = String(hoje.getFullYear()).slice(-2)
    const idBase = `${dia}${mes}${ano}`

    // 2. Lógica para encontrar um ID livre (Loop de verificação)
    let idFinal = idBase
    let contador = 1
    let idDisponivel = false

    while (!idDisponivel) {
      // Verifica se este ID já existe no banco
      const { data } = await supabase
        .from('Lote')
        .select('id')
        .eq('id', idFinal)
        .single()

      if (!data) {
        // Se não retornou nada, o ID está livre!
        idDisponivel = true
      } else {
        // Se retornou dado, o ID existe. Vamos tentar o próximo.
        contador++
        idFinal = `${idBase}-${contador}`
      }
    }

    // 3. Calcular Previsão (Hoje + 10 dias)
    const previsao = new Date()
    previsao.setDate(previsao.getDate() + 10)

    // 4. Enviar para o Supabase com o ID GARANTIDO
    const { error } = await supabase.from('Lote').insert({
      id: idFinal, // Usa o ID calculado (ex: 050126 ou 050126-2)
      produto: tipo,
      qtd_garrafas_750: qtdGarrafas750,
      qtd_garrafas_375: qtdGarrafas375,
      data_inicio: new Date(),
      data_previsao: previsao,
      status: 'em_infusao'
    })

    if (error) {
      alert("Erro ao salvar lote: " + error.message)
      setLoading(false)
    } else {
      // Sucesso!
      alert(`Lote ${idFinal} iniciado com sucesso!`) // Mostra o ID final para o usuário ver
      router.push('/lotes')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-yellow-600 tracking-tight">RAFFINATO 🍋</h1>
        <p className="text-gray-500 font-medium">Calculadora de Produção</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Configuração</label>
            
            <div className="mb-6">
              <span className="block text-sm font-bold text-gray-700 mb-2">Produto</span>
              <div className="flex gap-2">
                <button onClick={() => setTipo('limoncello')} className={`flex-1 py-3 rounded-lg font-bold transition-all cursor-pointer hover:scale-105 ${tipo === 'limoncello' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Limoncello</button>
                <button onClick={() => setTipo('arancello')} className={`flex-1 py-3 rounded-lg font-bold transition-all cursor-pointer hover:scale-105 ${tipo === 'arancello' ? 'bg-orange-400 text-orange-900 shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Arancello</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-bold text-gray-700 mb-2">Garrafas 750ml</span>
                <div className="relative">
                  <input type="number" value={qtdInput750} onChange={(e) => handleChange(e.target.value, setQtdInput750)} placeholder="0" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-xl text-2xl font-black text-gray-800 outline-none transition-all" />
                </div>
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-700 mb-2">Garrafas 375ml</span>
                <div className="relative">
                  <input type="number" value={qtdInput375} onChange={(e) => handleChange(e.target.value, setQtdInput375)} placeholder="0" className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-xl text-2xl font-black text-gray-800 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between flex-grow">
            <div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processo de Produção</h2>
                 <span className="text-xs font-mono text-gray-500">Densidade Ajustada: {tipo}</span>
              </div>
              
              <div className="space-y-8">
                <div>
                  <p className="text-xs text-yellow-500 font-bold uppercase mb-2">Fase 1: Infusão Alcoólica</p>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                    <span className="text-gray-300">Álcool de Cereais (c/ Óleo)</span>
                    <span className="text-3xl font-mono font-bold text-yellow-400">{volAlcoolNecessario.toFixed(0)} <small className="text-sm text-gray-500">ml</small></span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase mb-2">Fase 2: Preparo do Xarope</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Água Filtrada</span>
                      <span className="text-3xl font-mono font-bold text-blue-400">{totalAguaMl.toFixed(0)} <small className="text-sm text-gray-500">ml</small></span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-300">Açúcar Refinado</span>
                      <span className="text-3xl font-mono font-bold text-white">{totalAcucarGramas.toFixed(0)} <small className="text-sm text-gray-500">g</small></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 grid grid-cols-2 gap-4">
               <div className="bg-gray-800 p-4 rounded-xl">
                  <span className="block text-xs text-gray-400 uppercase mb-1">Volume de Xarope</span>
                  <span className="block text-2xl font-mono font-bold text-white">{volXaropeNecessario.toFixed(0)} ml</span>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-green-900/50">
                  <span className="block text-xs text-gray-400 uppercase mb-1">Rendimento Final</span>
                  <span className="block text-2xl font-mono font-bold text-green-400">{(volTotalProducao / 1000).toFixed(2)} Litros</span>
               </div>
            </div>
          </div>

          {/* === BOTÃO DE AÇÃO === */}
          <button
            onClick={handleSalvarLote}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-2xl shadow-lg cursor-pointer transition-all text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Salvando...</span>
            ) : (
              <>
                <span>Iniciar Produção</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}