"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { NOME_INSUMO, RECEITA } from '@/lib/constants'
import { ModalAlerta } from './ModalAlerta'
import { ModalConfirmacao } from './ModalConfirmacao'
import type { AlertType } from '@/types'

export function CalculadoraXarope() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sucoInput, setSucoInput] = useState('')
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  const [confirmacao, setConfirmacao] = useState({ isOpen: false, stage: 0, isDangerous: false })
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(() => {})

  // Estados apenas para mostrar saldo na tela (não usados para salvar)
  const [estAcucar, setEstAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estGarrafaVazia, setEstGarrafaVazia] = useState<{id: string, qtd: number} | null>(null)

  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (data) {
            // Busca exata usando as constantes corrigidas
            const acucar = data.find(i => i.nome === NOME_INSUMO.ACUCAR)
            const garrVazia = data.find(i => i.nome === NOME_INSUMO.GARRAFA_XAROPE_VAZIA)

            if (acucar) setEstAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (garrVazia) setEstGarrafaVazia({ id: garrVazia.id, qtd: garrVazia.quantidade_atual })
        }
    } catch (err) { console.error(err) }
  }

  // Cálculos de Receita
  const qtdSuco = Number(sucoInput.replace(',', '.')) || 0
  
  // 1kg por litro
  const qtdAcucarXarope = qtdSuco * RECEITA.XAROPE_KG_ACUCAR_POR_L_SUCO 
  
  // 300ml por litro
  const qtdAguaXarope = qtdSuco * RECEITA.XAROPE_L_AGUA_POR_L_SUCO
  
  // Volume que o açúcar ocupa
  const volumeAcucar = qtdAcucarXarope * RECEITA.VOLUME_POR_KG_ACUCAR 
  
  const volumeFinalXarope = qtdSuco + qtdAguaXarope + volumeAcucar
  const garrafasGeradas = Math.floor(volumeFinalXarope)
  const sobraLiquida = volumeFinalXarope - garrafasGeradas

  // Validação Visual
  const saldoAcucarOk = (estAcucar?.qtd || 0) >= qtdAcucarXarope
  const saldoGarrafasOk = (estGarrafaVazia?.qtd || 0) >= garrafasGeradas

  const handleSalvarXarope = async () => {
    if (qtdSuco <= 0) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Digite a quantidade de suco.', type: 'error' })
      return
    }
    
    // Verificações de segurança
    if (!estAcucar?.id) {
      setAlerta({ isOpen: true, title: 'Erro', message: `Item '${NOME_INSUMO.ACUCAR}' não encontrado no banco. Verifique o nome exato.`, type: 'error' })
      return
    }
    if (!estGarrafaVazia?.id) {
      setAlerta({ isOpen: true, title: 'Erro', message: `Item '${NOME_INSUMO.GARRAFA_XAROPE_VAZIA}' não encontrado no banco. Verifique o nome exato.`, type: 'error' })
      return
    }

    if (!saldoAcucarOk || !saldoGarrafasOk) {
       setConfirmacao({ isOpen: true, stage: 1, isDangerous: true })
       setOnConfirmCallback(() => procesarXarope)
    } else {
       setConfirmacao({ isOpen: true, stage: 2, isDangerous: false })
       setOnConfirmCallback(() => procesarXarope)
    }
  }

  const procesarXarope = async () => {
    setConfirmacao({ isOpen: false, stage: 0, isDangerous: false })
    
    if (!estAcucar || !estGarrafaVazia) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Estoques não carregados. Tente novamente.', type: 'error' })
      return
    }
    
    setLoading(true)
    try {
        // CHAMADA DA NOVA FUNÇÃO SQL (RPC)
        const { error } = await supabase.rpc('produzir_xarope_v2', {
            p_id_acucar: estAcucar.id,
            p_qtd_acucar: qtdAcucarXarope,
            p_id_garrafa_vazia: estGarrafaVazia.id,
            p_qtd_garrafa_vazia: garrafasGeradas,
            p_qtd_produzida: garrafasGeradas
        })

        if (error) throw error

        // Log de sucesso
        await supabase.from('Logs').insert({ 
            categoria: 'PRODUCAO', 
            acao: 'XAROPE', 
            descricao: `Produziu ${garrafasGeradas} garrafas Xarope (Gastou ${qtdSuco}L Suco)` 
        })

        setAlerta({ isOpen: true, title: 'Sucesso', message: 'Produção registrada.', type: 'success' })
        router.push('/') 
        setSucoInput('')

    } catch (err: any) { 
        setAlerta({ isOpen: true, title: 'Erro', message: `Erro ao processar: ${err.message}`, type: 'error' })
    } finally { 
        setLoading(false) 
    }
  }

  const RowEstoque = ({ label, atual, necessario, ok, unidade }: any) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
        <span className="font-bold text-gray-700">{label}</span>
        <div className="text-right flex flex-col items-end">
            <div className="text-xs text-gray-400">Disp: {atual?.toFixed(2)}{unidade}</div>
            <div className={`font-bold font-mono ${!ok ? 'text-red-600' : 'text-green-600'}`}>
                -{necessario.toFixed(2)}{unidade}
            </div>
        </div>
    </div>
  )

  return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Ingrediente Principal</label>
                <div className="mb-2">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Suco de Limão (Litros)</span>
                    <div className="relative">
                        <input type="text" inputMode='decimal' placeholder='0' value={sucoInput} onChange={(e) => setSucoInput(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" />
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 space-y-2">
                    <p className="font-bold uppercase tracking-wider text-gray-400">Proporção da Receita</p>
                    <p>Para cada <b>1L de Suco</b>, acrescenta-se:</p>
                    <ul className="list-disc pl-4 space-y-1 font-bold">
                        <li>{(RECEITA.XAROPE_L_AGUA_POR_L_SUCO * 1000).toFixed(0)}ml de Água</li>
                        <li>{RECEITA.XAROPE_KG_ACUCAR_POR_L_SUCO}kg de Açúcar</li>
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Disponibilidade</h3>
                 {volumeFinalXarope > 0 ? (
                    <div className="space-y-1">
                        <RowEstoque label="Açúcar" atual={estAcucar?.qtd || 0} necessario={qtdAcucarXarope} ok={saldoAcucarOk} unidade="kg" />
                        <RowEstoque label="Garrafa Xarope (Vazia)" atual={estGarrafaVazia?.qtd || 0} necessario={garrafasGeradas} ok={saldoGarrafasOk} unidade="un" />
                        {!saldoAcucarOk && (<div className="mt-3 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded text-center uppercase tracking-wide">Estoque Insuficiente</div>)}
                    </div>
                 ) : (
                    <p className="text-sm text-gray-400 italic">Digite o volume.</p>
                 )}
            </div>
        </div>

        <div className="md:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-gray-900 flex flex-col justify-between h-full min-h-[400px]">
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Resultado Previsto</h2>
                <div className="flex items-center gap-6 mb-8">
                    <div><span className="block text-5xl font-black text-gray-900">{garrafasGeradas}</span><span className="text-xl font-bold text-gray-400">Garrafas Prontas</span></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-sm font-medium space-y-1 border border-gray-200">
                    <p className="text-gray-900">• Volume Total Líquido: <b>{volumeFinalXarope.toFixed(2)} L</b></p>
                    <p className="text-gray-900">• Sobra Líquida (fundo): <b>{sobraLiquida.toFixed(2)} L</b></p>
                </div>
            </div>
            <button onClick={handleSalvarXarope} disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 mt-8 ">{loading ? 'Engarrafando...' : 'Confirmar Produção e Engarrafar'}</button>
        </div>

        <ModalConfirmacao
          isOpen={confirmacao.isOpen}
          title={confirmacao.stage === 1 ? '⚠️ Estoque Insuficiente' : 'Confirmar Produção'}
          message={confirmacao.stage === 1 ? 'Estoque visualmente insuficiente. Deseja tentar forçar a produção?' : `Produzir ${garrafasGeradas} garrafas de Xarope?`}
          isDangerous={confirmacao.isDangerous}
          onConfirm={() => {
            setConfirmacao({ isOpen: false, stage: 0, isDangerous: false })
            onConfirmCallback()
          }}
          onCancel={() => setConfirmacao({ isOpen: false, stage: 0, isDangerous: false })}
          loading={loading}
        />

        <ModalAlerta
          isOpen={alerta.isOpen}
          title={alerta.title}
          message={alerta.message}
          type={alerta.type}
          onClose={() => setAlerta({ ...alerta, isOpen: false })}
        />
      </div>
  )
}