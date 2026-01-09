"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function CalculadoraXarope() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sucoInput, setSucoInput] = useState('')

  // Estoques (Apenas Açúcar e Garrafas)
  const [estAcucar, setEstAcucar] = useState<{id: string, qtd: number} | null>(null)
  const [estGarrafaVazia, setEstGarrafaVazia] = useState<{id: string, qtd: number} | null>(null)
  const [estGarrafaCheia, setEstGarrafaCheia] = useState<{id: string} | null>(null)

  useEffect(() => {
    fetchEstoques()
  }, [])

  const fetchEstoques = async () => {
    try {
        const { data } = await supabase.from('Insumo').select('id, nome, quantidade_atual')
        if (data) {
            const acucar = data.find(i => i.nome.toLowerCase().includes('acucar') || i.nome.toLowerCase().includes('açúcar'))
            // Nota: Garrafa Vazia deve ter nome "Garrafa Xarope" no banco
            const garrVazia = data.find(i => i.nome === 'Garrafa Xarope') 
            // Nota: Garrafa Cheia (Produto) deve ter nome "Xarope Limão Siciliano"
            const garrCheia = data.find(i => i.nome === 'Xarope Limão Siciliano' || i.nome === 'Garrafa Xarope (Cheia)')

            if (acucar) setEstAcucar({ id: acucar.id, qtd: acucar.quantidade_atual })
            if (garrVazia) setEstGarrafaVazia({ id: garrVazia.id, qtd: garrVazia.quantidade_atual })
            if (garrCheia) setEstGarrafaCheia({ id: garrCheia.id })
        }
    } catch (err) { console.error(err) }
  }

  // Cálculos Xarope
  const qtdSuco = Number(sucoInput.replace(',', '.')) || 0
  
  // PROPORÇÃO:
  // 1L Suco : 1kg Açúcar : 300ml Água
  const qtdAcucarXarope = qtdSuco * 1.0 
  const qtdAguaXarope = qtdSuco * 0.3 

  // Volume do Açúcar: 1kg vira 0.65L (650g de volume)
  const volumeAcucar = qtdAcucarXarope * 0.65

  // Volume Total = Suco + Água + Volume Açúcar
  const volumeFinalXarope = qtdSuco + qtdAguaXarope + volumeAcucar
  
  const garrafasGeradas = Math.floor(volumeFinalXarope)
  const sobraLiquida = volumeFinalXarope - garrafasGeradas

  // Saldos (Não verifica Suco)
  const saldoAcucarXarope = (estAcucar?.qtd || 0) - qtdAcucarXarope
  const saldoGarrafasVazias = (estGarrafaVazia?.qtd || 0) - garrafasGeradas
  
  const temInsumosXarope = saldoAcucarXarope >= 0 && saldoGarrafasVazias >= 0

  const handleSalvarXarope = async () => {
    if (qtdSuco <= 0) return alert("Digite a quantidade de suco.")
    if (!estGarrafaCheia || !estGarrafaVazia) return alert("ERRO: Itens de Xarope (Vazia ou Cheia) não encontrados no estoque.")

    if (!temInsumosXarope) {
       if (!window.confirm("Insumos insuficientes (Açúcar ou Garrafas). Deseja continuar e negativar estoque?")) return
    } else {
       if (!window.confirm(`Produzir ${garrafasGeradas} garrafas de Xarope?`)) return
    }

    setLoading(true)
    try {
        // Baixa Açúcar
        if (estAcucar) await supabase.rpc('decrement_estoque', { p_id: estAcucar.id, p_qtd: qtdAcucarXarope })
        // Baixa Garrafa Vazia
        if (estGarrafaVazia) await supabase.rpc('decrement_estoque', { p_id: estGarrafaVazia.id, p_qtd: garrafasGeradas })
        
        // Aumenta Garrafa Cheia (Produto no Dashboard)
        await supabase.rpc('increment_estoque_insumo', { p_id: estGarrafaCheia.id, p_qtd: garrafasGeradas })

        await supabase.from('Logs').insert({ categoria: 'PRODUCAO', acao: 'XAROPE', descricao: `Produziu ${garrafasGeradas} garrafas Xarope (Gastou ${qtdSuco}L Suco)` })

        alert(`Sucesso! +${garrafasGeradas} garrafas de Xarope criadas.`)
        router.push('/insumos') 
        setSucoInput('')
    } catch (err: any) { alert("Erro: " + err.message) } finally { setLoading(false) }
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Ingrediente Principal</label>
                <div className="mb-2">
                    <span className="block text-sm font-bold text-gray-700 mb-2">Suco de Limão</span>
                    <div className="relative">
                        <input type="number" autoFocus placeholder='Ex: 5' value={sucoInput} onChange={(e) => setSucoInput(e.target.value)} className="w-full p-4 bg-white border-2 border-gray-200 focus:border-black rounded-xl text-4xl font-black text-gray-900 outline-none transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Litros</span>
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
                    <RowEstoque label="Açúcar" atual={estAcucar?.qtd || 0} necessario={qtdAcucarXarope} saldo={saldoAcucarXarope} unidade="kg" />
                    <RowEstoque label="Garrafa Xarope (Vazia)" atual={estGarrafaVazia?.qtd || 0} necessario={garrafasGeradas} saldo={saldoGarrafasVazias} unidade="un" />
                 </div>
            </div>
        </div>

        <div className="md:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-gray-900 flex flex-col justify-between h-full min-h-[400px]">
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Resultado Previsto</h2>
                <div className="flex items-center gap-6 mb-8">
                    <div className="text-6xl text-gray-900">🏺</div>
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