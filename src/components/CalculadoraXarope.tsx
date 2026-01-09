"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { NOME_INSUMO } from '@/lib/constants'

export function CalculadoraXarope() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sucoInput, setSucoInput] = useState('')

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
  const qtdAcucarXarope = qtdSuco * 1.0  // 1kg por litro
  const qtdAguaXarope = qtdSuco * 0.3    // 300ml por litro
  const volumeAcucar = qtdAcucarXarope * 0.65 // Volume que o açúcar ocupa
  const volumeFinalXarope = qtdSuco + qtdAguaXarope + volumeAcucar
  const garrafasGeradas = Math.floor(volumeFinalXarope)
  const sobraLiquida = volumeFinalXarope - garrafasGeradas

  // Validação Visual
  const saldoAcucarOk = (estAcucar?.qtd || 0) >= qtdAcucarXarope
  const saldoGarrafasOk = (estGarrafaVazia?.qtd || 0) >= garrafasGeradas

  const handleSalvarXarope = async () => {
    if (qtdSuco <= 0) return alert("Digite a quantidade de suco.")
    
    // Verificações de segurança
    if (!estAcucar?.id) return alert(`ERRO: Item '${NOME_INSUMO.ACUCAR}' não encontrado no banco. Verifique o nome exato.`)
    if (!estGarrafaVazia?.id) return alert(`ERRO: Item '${NOME_INSUMO.GARRAFA_XAROPE_VAZIA}' não encontrado no banco. Verifique o nome exato.`)

    if (!saldoAcucarOk || !saldoGarrafasOk) {
       if (!window.confirm("⚠️ Estoque visualmente insuficiente. Deseja tentar forçar a produção?")) return
    } else {
       if (!window.confirm(`Produzir ${garrafasGeradas} garrafas de Xarope?`)) return
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

        alert(`Sucesso! Produção registrada.`)
        router.push('/') 
        setSucoInput('')

    } catch (err: any) { 
        alert("Erro ao processar: " + err.message) 
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
                -{necessario.toFixed(2)}
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
                    <span className="block text-sm font-bold text-gray-700 mb-2">Suco de Limão</span>
                    <div className="relative">
                        <input type="number" autoFocus placeholder='0' value={sucoInput} onChange={(e) => setSucoInput(e.target.value)} className="w-full p-4 bg-white border-2 border-gray-200 focus:border-black rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" />
                    </div>
                    <p className="text-xs text-right mt-2 text-gray-400 italic">Não desconta do estoque</p>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 space-y-2">
                    <p className="font-bold uppercase tracking-wider text-gray-400">Proporção da Receita</p>
                    <p>Para cada <b>1L de Suco</b>, acrescenta-se:</p>
                    <ul className="list-disc pl-4 space-y-1 font-bold">
                        <li>300ml de Água</li>
                        <li>1kg de Açúcar</li>
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Insumos Necessários</h3>
                 <div className="space-y-1">
                    <RowEstoque label="Açúcar" atual={estAcucar?.qtd || 0} necessario={qtdAcucarXarope} ok={saldoAcucarOk} unidade="kg" />
                    <RowEstoque label="Garrafa Xarope (Vazia)" atual={estGarrafaVazia?.qtd || 0} necessario={garrafasGeradas} ok={saldoGarrafasOk} unidade="un" />
                 </div>
            </div>
        </div>

        <div className="md:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-gray-900 flex flex-col justify-between h-full min-h-[400px]">
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Resultado Previsto</h2>
                <div className="flex items-center gap-6 mb-8">
                    <div><span className="block text-5xl font-black text-gray-900">{garrafasGeradas}</span><span className="text-xl font-bold text-gray-400">Garrafas Prontas</span></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-sm font-medium space-y-1 border border-gray-200">
                    <p className="text-gray-900">• Volume Total Líquido: <b>{volumeFinalXarope.toFixed(2)} Litros</b></p>
                    <p className="text-gray-900">• Sobra Líquida (fundo): <b>{sobraLiquida.toFixed(2)} Litros</b></p>
                </div>
            </div>
            <button onClick={handleSalvarXarope} disabled={loading || qtdSuco <= 0} className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 mt-8 cursor-pointer">{loading ? 'Engarrafando...' : 'Confirmar Produção e Engarrafar'}</button>
        </div>
      </div>
  )
}