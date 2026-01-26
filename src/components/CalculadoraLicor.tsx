"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { RECEITA, NOME_INSUMO } from '@/lib/constants'
import { ModalAlerta } from './ModalAlerta'
import { ModalConfirmacao } from './ModalConfirmacao'
import type { AlertType } from '@/types'

export function CalculadoraLicor() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estados para Modais
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  const [confirmacao, setConfirmacao] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  })
  
  const [loteManual, setLoteManual] = useState('')
  const [litrosInput, setLitrosInput] = useState('')
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // Estoques
  const [estAcucar, setEstAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estBaseL, setEstBaseL] = useState<{id: string, qtd: number} | null>(null)
  const [estBaseA, setEstBaseA] = useState<{id: string, qtd: number} | null>(null)

  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (data) {
            const acucar = data.find(i => i.nome === NOME_INSUMO.ACUCAR)
            const baseL = data.find(i => i.nome === NOME_INSUMO.BASE_LIMONCELLO_FILTRADA)
            const baseA = data.find(i => i.nome === NOME_INSUMO.BASE_ARANCELLO_FILTRADA)

            if (acucar) setEstAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (baseL) setEstBaseL({ id: baseL.id, qtd: baseL.quantidade_atual })
            if (baseA) setEstBaseA({ id: baseA.id, qtd: baseA.quantidade_atual })
        }
    } catch (err) { console.error(err) }
  }

  // Cálculos
  const volumeTotalLitros = Number(litrosInput.replace(',', '.')) || 0
  const volumeTotalMl = volumeTotalLitros * 1000

  const volBaseNecessariaMl = volumeTotalMl * RECEITA.RAZAO_ALCOOL
  const volBaseNecessariaL = volBaseNecessariaMl / 1000

  const volXaropeNecessarioMl = volumeTotalMl * RECEITA.RAZAO_XAROPE
  const fatorXarope = tipo === 'limoncello' ? RECEITA.FATOR_XAROPE_LIMONCELLO : RECEITA.FATOR_XAROPE_ARANCELLO
  const fatorAgua = tipo === 'limoncello' ? RECEITA.AGUA_POR_G_ACUCAR_LIMONCELLO : RECEITA.AGUA_POR_G_ACUCAR_ARANCELLO

  const totalAcucarGramas = volXaropeNecessarioMl / fatorXarope
  const kgAcucarNecessarios = totalAcucarGramas / 1000
  const totalAguaMl = totalAcucarGramas * fatorAgua
  const garrafasEstimadas = volumeTotalLitros / 0.75

  // Seleção e Validação
  const estBaseSelecionada = tipo === 'limoncello' ? estBaseL : estBaseA
  const saldoAcucar = (estAcucar?.qtd || 0) - kgAcucarNecessarios
  const saldoBase = (estBaseSelecionada?.qtd || 0) - volBaseNecessariaL
  const temInsumos = saldoAcucar >= 0 && saldoBase >= 0

  const handleSalvarLote = async () => {
    if (!loteManual.trim()) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Digite o NÚMERO DO LOTE.', type: 'error' })
      return
    }
    
    if (volumeTotalLitros <= 0) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Insira uma quantidade válida.', type: 'error' })
      return
    }

    if (!estAcucar) {
      setAlerta({ isOpen: true, title: 'Erro', message: `Item '${NOME_INSUMO.ACUCAR}' não encontrado no estoque.`, type: 'error' })
      return
    }
    
    if (!estBaseSelecionada) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Item Base Alcoólica não encontrado no estoque.', type: 'error' })
      return
    }

    // Se chegou aqui, mostra confirmação
    const mensagem = !temInsumos 
      ? `⚠️ ATENÇÃO: Estoque INSUFICIENTE.\n\nDeseja continuar e negativar o estoque?`
      : `Confirma a produção de ${volumeTotalLitros}L de ${tipo}?`
    
    const title = !temInsumos ? 'Estoque Insuficiente' : 'Confirmar Produção'

    setConfirmacao({
      isOpen: true,
      title,
      message: mensagem,
      onConfirm: async () => {
        setLoading(true)
        try {
          const { error } = await supabase.rpc('produzir_licor', {
            p_lote_id: loteManual,
            p_produto: tipo,
            p_volume_novo: volumeTotalLitros,
            p_id_acucar: estAcucar.id,
            p_qtd_acucar: kgAcucarNecessarios,
            p_id_base: estBaseSelecionada.id,
            p_qtd_base: volBaseNecessariaL
          })

          if (error) throw error

          await supabase.from('Logs').insert({ 
            categoria: 'PRODUCAO', 
            acao: 'PRODUCAO_LOTE', 
            descricao: `Lote ${loteManual}: +${volumeTotalLitros}L ${tipo}` 
          })

          setAlerta({ 
            isOpen: true, 
            title: 'Sucesso!', 
            message: `Lote ${loteManual} registrado e insumos descontados!`,
            type: 'success'
          })
          
          setTimeout(() => router.push('/lotes'), 1500)
          
        } catch (error: any) {
          setAlerta({ 
            isOpen: true, 
            title: 'Erro', 
            message: 'Erro ao salvar: ' + error.message,
            type: 'error'
          })
        } finally {
          setLoading(false)
          setConfirmacao({ ...confirmacao, isOpen: false })
        }
      }
    })
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
        <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Planejamento</label>
                <div className="mb-6">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Produto</span>
                    <div className="flex gap-2">
                        <button onClick={() => setTipo('limoncello')} className={`flex-1 py-3  rounded-lg font-bold transition-all ${tipo === 'limoncello' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Limoncello</button>
                        <button onClick={() => setTipo('arancello')} className={`flex-1 py-3  rounded-lg font-bold transition-all ${tipo === 'arancello' ? 'bg-orange-400 text-orange-900 shadow-md' : 'bg-gray-100 text-gray-400'}`}>Arancello</button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-3 shadow-sm">
                        <div className="border-blue-200 text-[10px] text-blue-500 font-bold text-center uppercase tracking-wider">
                            29,17% Base • 70,83% Xarope
                        </div>
                    </div>
                </div>
                <div className="mb-6">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Nº do Lote</span>
                    <input type="text" placeholder='Ex: 050126' value={loteManual} onChange={(e) => setLoteManual(e.target.value.toUpperCase())} className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-black rounded-xl text-lg font-bold text-gray-900 outline-none" />
                </div>
                <div>
                    <span className="block text-sm font-bold text-gray-700 mb-2">Volume a Produzir (Litros)</span>
                    <div className="relative">
                        <input type="text" inputMode="decimal" placeholder='0' value={litrosInput} onChange={(e) => setLitrosInput(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">Disponibilidade</h3>
                {volumeTotalLitros > 0 ? (
                    <div className="space-y-1">
                        <RowEstoque label={`Base ${tipo}`} atual={estBaseSelecionada?.qtd || 0} necessario={volBaseNecessariaL} saldo={saldoBase} unidade="L" />
                        <RowEstoque label="Açúcar" atual={estAcucar?.qtd || 0} necessario={kgAcucarNecessarios} saldo={saldoAcucar} unidade="kg" />
                        {!temInsumos && (<div className="mt-3 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded text-center uppercase tracking-wide">Estoque Insuficiente</div>)}
                    </div>
                ) : (<p className="text-sm text-gray-400 italic">Digite o volume.</p>)}
            </div>
        </div>

        <div className="md:col-span-8 bg-white text-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-full min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ficha Técnica</h2>
                 <span className="text-xs font-mono text-gray-400 capitalize">{loteManual || 'Novo Lote'}</span>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-xs text-yellow-600 font-bold uppercase mb-2">1. Base Alcoólica ({(RECEITA.RAZAO_ALCOOL * 100).toFixed(2)}%)</p>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Base {tipo === 'limoncello' ? 'Limoncello' : 'Arancello'}</span>
                    <span className="text-3xl font-mono font-bold text-gray-900">{volBaseNecessariaL.toFixed(2)} <small className="text-sm text-gray-400">L</small></span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase mb-2">2. Xarope ({(RECEITA.RAZAO_XAROPE * 100).toFixed(2)}%)</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-2"><span className="text-gray-500">Água</span><span className="text-3xl font-mono font-bold text-gray-900">{(totalAguaMl / 1000).toFixed(2)} <small className="text-sm text-gray-400">L</small></span></div>
                    <div className="flex justify-between items-end border-b border-gray-100 pb-2"><span className="text-gray-500">Açúcar</span><span className="text-3xl font-mono font-bold text-gray-900">{kgAcucarNecessarios.toFixed(2)} <small className="text-sm text-gray-400">kg</small></span></div>
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
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-4"><span className="text-xs text-gray-400 uppercase font-bold">Rendimento Estimado</span><span className="text-3xl font-mono font-black text-green-600">± {garrafasEstimadas.toFixed(0)} <span className="text-lg text-green-700">garrafas</span></span></div>
               <button type="button" onClick={handleSalvarLote} disabled={loading} className={`w-full font-bold py-5 rounded-2xl shadow-lg  transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 ${temInsumos ? 'bg-black hover:bg-gray-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>{loading ? 'Salvando...' : (temInsumos ? 'Confirmar Produção' : 'Estoque Insuficiente (Forçar)')}</button>
            </div>
        </div>

        {/* Modais */}
        <ModalAlerta
          isOpen={alerta.isOpen}
          title={alerta.title}
          message={alerta.message}
          type={alerta.type as any}
          onClose={() => setAlerta({ ...alerta, isOpen: false })}
        />

        <ModalConfirmacao
          isOpen={confirmacao.isOpen}
          title={confirmacao.title}
          message={confirmacao.message}
          onConfirm={confirmacao.onConfirm}
          onCancel={() => setConfirmacao({ ...confirmacao, isOpen: false })}
          loading={loading}
          isDangerous={!temInsumos}
        />
      </div>
  )
}