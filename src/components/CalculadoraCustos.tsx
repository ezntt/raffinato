"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { NOME_INSUMO } from '@/lib/constants'
import { ModalAlerta } from './ModalAlerta'

// --- ÍCONES ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

// --- COMPONENTES AUXILIARES ---

const InputMoney = ({ label, val, onChange, onSave, placeholder = "0.00" }: any) => {
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)

  const handleChange = (newValue: string) => {
      onChange(newValue)
      setChanged(true)
  }

  const handleSaveClick = async () => {
      setSaving(true)
      await onSave()
      setSaving(false)
      setChanged(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault() 
          handleSaveClick()
      }
  }

  return (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
        <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
            <input 
                inputMode="decimal"
                value={val}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-14 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300"
                placeholder={placeholder}
            />
            <button 
                onClick={handleSaveClick}
                disabled={saving}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm
                    ${saving ? 'bg-gray-300 cursor-wait' : 'bg-black hover:bg-gray-800 text-white cursor-pointer'}
                    ${!changed && !saving ? 'opacity-50' : 'opacity-100'} 
                `}
                title="Salvar (Enter)"
            >
                {saving ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"/> : <CheckIcon />}
            </button>
        </div>
    </div>
  )
}

const CardPreco = ({ titulo, total, cor, onClick }: { titulo: string, total: number, cor: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border ${cor} bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group`}
  >
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase group-hover:text-black transition-colors">{titulo}</span>
        <span className="text-gray-300 text-xs">ℹ️</span>
      </div>
      <div className="mt-2">
          <span className="text-2xl font-black text-gray-900">R$ {total.toFixed(2)}</span>
      </div>
  </div>
)

const ModalDetalhes = ({ data, onClose }: { data: any, onClose: () => void }) => {
    if (!data) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className={`p-6 border-b border-gray-100 flex justify-between items-start ${data.corBg}`}>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">{data.titulo}</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase mt-1">Detalhamento de Custos</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><CloseIcon /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="text-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Custo Total por Garrafa</span>
                        <div className="text-4xl font-black text-gray-900 mt-1">R$ {data.total.toFixed(2)}</div>
                    </div>

                    {/* SEÇÃO LÍQUIDO */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                            <span className="font-bold text-gray-900 uppercase text-xs">Líquido (Insumos)</span>
                            <span className="font-black text-gray-900 text-sm">R$ {data.liquido.total.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between"><span>Álcool ({data.liquido.volAlcool}ml)</span><span className="font-mono font-bold">R$ {data.liquido.custoAlcool.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Açúcar ({data.liquido.volAcucar}kg)</span><span className="font-mono font-bold">R$ {data.liquido.custoAcucar.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>{data.liquido.nomeFruta}</span><span className="font-mono font-bold">R$ {data.liquido.custoFruta.toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* SEÇÃO EMBALAGEM */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                            <span className="font-bold text-gray-900 uppercase text-xs">Embalagem</span>
                            <span className="font-black text-gray-900 text-sm">R$ {data.embalagem.total.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between"><span>Garrafa</span><span className="font-mono font-bold">R$ {data.embalagem.garrafa.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tampa</span><span className="font-mono font-bold">R$ {data.embalagem.tampa.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Rótulo</span><span className="font-mono font-bold">R$ {data.embalagem.rotulo.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Lacre + Selo</span><span className="font-mono font-bold">R$ {(data.embalagem.lacre + data.embalagem.selo).toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* NOVA SEÇÃO: CUSTOS FIXOS */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex justify-between items-center mb-2 border-b border-purple-200 pb-2">
                            <span className="font-bold text-purple-900 uppercase text-xs">Rateio Despesas</span>
                            <span className="font-black text-purple-900 text-sm">R$ {data.fixo.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-purple-700 leading-tight">
                            Valor baseado na simulação de vendas. Quanto mais você vende, menor este valor fica por unidade.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

// --- LÓGICA DO NEGÓCIO ---

const FORMULA = {
  L750: { alcool_ml: 218.78, acucar_kg: 0.183 },
  L375: { alcool_ml: 109.39, acucar_kg: 0.0915 },
  A750: { alcool_ml: 218.78, acucar_kg: 0.183 }, 
  A375: { alcool_ml: 109.39, acucar_kg: 0.0915 },
}

// Lista exata de insumos que devem aparecer (LIMAO E LARANJA REMOVIDOS)
const ITENS_PERMITIDOS = [
  NOME_INSUMO.GARRAFA_750, NOME_INSUMO.GARRAFA_375,
  NOME_INSUMO.TAMPA, NOME_INSUMO.LACRE, NOME_INSUMO.SELO,
  NOME_INSUMO.ROTULO_LIMONCELLO_750, NOME_INSUMO.ROTULO_LIMONCELLO_375,
  NOME_INSUMO.ROTULO_ARANCELLO_750, NOME_INSUMO.ROTULO_ARANCELLO_375,
  NOME_INSUMO.ALCOOL, NOME_INSUMO.ACUCAR,
]

export function CalculadoraCustos() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'error' as const })
  
  // Controle de Modais
  const [showInfo, setShowInfo] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)

  // Dados
  const [insumos, setInsumos] = useState<any[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Inputs
  const [precos, setPrecos] = useState<Record<string, string>>({})
  const [despesas, setDespesas] = useState({
    aluguel: '', luz: '', agua: '', contador: '',
    rt: '', contribSocial: '', tributos: ''
  })
  
  // Simulação de Vendas
  const [garrafasVendidas, setGarrafasVendidas] = useState('')

  // ESTADO FRUTAS (MANUAL)
  const [custoLimao, setCustoLimao] = useState<string>('')
  const [custoLaranja, setCustoLaranja] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
        const { data: insumosData } = await supabase.from('Insumo').select('id, nome, custo_atual, unidade').order('nome')
        if (insumosData) {
            const filtrados = insumosData.filter(i => ITENS_PERMITIDOS.includes(i.nome))
            setInsumos(filtrados)
            const mapPrecos: Record<string, string> = {}
            filtrados.forEach(i => { mapPrecos[i.nome] = i.custo_atual ? String(i.custo_atual) : '' })
            setPrecos(mapPrecos)
        }

        const { data: emp } = await supabase.from('Empresa').select('*').single()
        if (emp) {
            setEmpresaId(emp.id)
            setDespesas({
                aluguel: emp.custo_aluguel ? String(emp.custo_aluguel) : '',
                luz: emp.custo_luz ? String(emp.custo_luz) : '',
                agua: emp.custo_agua ? String(emp.custo_agua) : '',
                contador: emp.custo_contador ? String(emp.custo_contador) : '',
                rt: emp.custo_rt ? String(emp.custo_rt) : '',
                contribSocial: emp.custo_contribuicao_social ? String(emp.custo_contribuicao_social) : '',
                tributos: emp.custo_tributos ? String(emp.custo_tributos) : '',
            })
            // Recupera valores salvos das frutas
            const savedLimao = localStorage.getItem('custoLimao')
            if (savedLimao) setCustoLimao(savedLimao)
            
            const savedLaranja = localStorage.getItem('custoLaranja')
            if (savedLaranja) setCustoLaranja(savedLaranja)
        }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // Handlers
  const handlePrecoChange = (nome: string, val: string) => setPrecos(prev => ({ ...prev, [nome]: val }))
  const handleDespesaChange = (campo: string, val: string) => setDespesas(prev => ({ ...prev, [campo]: val }))

  const salvarInsumoUnico = async (item: any) => {
    try {
        const valStr = precos[item.nome]
        const valNum = valStr ? parseFloat(valStr.replace(',', '.')) : 0
        await supabase.from('Insumo').update({ custo_atual: valNum }).eq('id', item.id)
        setInsumos(prev => prev.map(i => i.id === item.id ? { ...i, custo_atual: valNum } : i))
    } catch (err) { setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao salvar insumo', type: 'error' }) }
  }

  const salvarDespesaUnica = async (campo: string) => {
      try {
          // @ts-ignore
          const valStr = despesas[campo]
          const valNum = valStr ? parseFloat(valStr.replace(',', '.')) : 0
          const mapaColunas: Record<string, string> = {
              aluguel: 'custo_aluguel', luz: 'custo_luz', agua: 'custo_agua',
              contador: 'custo_contador', rt: 'custo_rt',
              contribSocial: 'custo_contribuicao_social', tributos: 'custo_tributos'
          }
          const coluna = mapaColunas[campo]
          if (!coluna) return

          if (empresaId) {
              await supabase.from('Empresa').update({ [coluna]: valNum }).eq('id', empresaId)
          } else {
              const { data } = await supabase.from('Empresa').insert({ [coluna]: valNum }).select().single()
              if (data) setEmpresaId(data.id)
          }
      } catch (err) { setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao salvar despesa', type: 'error' }) }
  }

  const salvarFrutas = async () => {
      localStorage.setItem('custoLimao', custoLimao)
      localStorage.setItem('custoLaranja', custoLaranja)
  }

  const handleSalvarTudo = async () => {
    setSaving(true)
    try {
        for (const item of insumos) { await salvarInsumoUnico(item) }
        const keys = Object.keys(despesas)
        for (const k of keys) { await salvarDespesaUnica(k) }
        salvarFrutas()
        setAlerta({ isOpen: true, title: 'Sucesso', message: 'Todos os dados foram salvos!', type: 'success' })
    } catch(err) { setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao salvar tudo', type: 'error' }) }
    finally { setSaving(false) }
  }

  const getVal = (nome: string) => {
      const v = precos[nome]
      return v ? parseFloat(v.replace(',', '.')) : 0
  }

  // --- CÁLCULO DETALHADO + RATEIO ---
  const getDetalhes = (tipo: 'L' | 'A', tamanho: 750 | 375, titulo: string, corBg: string) => {
      // 1. Embalagem
      const garrafa = getVal(tamanho === 750 ? NOME_INSUMO.GARRAFA_750 : NOME_INSUMO.GARRAFA_375)
      const tampa = getVal(NOME_INSUMO.TAMPA)
      const lacre = getVal(NOME_INSUMO.LACRE)
      const selo = getVal(NOME_INSUMO.SELO)
      let rotulo = 0
      if (tipo === 'L') rotulo = getVal(tamanho === 750 ? NOME_INSUMO.ROTULO_LIMONCELLO_750 : NOME_INSUMO.ROTULO_LIMONCELLO_375)
      if (tipo === 'A') rotulo = getVal(tamanho === 750 ? NOME_INSUMO.ROTULO_ARANCELLO_750 : NOME_INSUMO.ROTULO_ARANCELLO_375)
      const totalEmbalagem = garrafa + tampa + lacre + selo + rotulo

      // 2. Líquido
      const ref = tamanho === 750 ? FORMULA.L750 : FORMULA.L375
      const custoAlcool = (ref.alcool_ml / 1000) * getVal(NOME_INSUMO.ALCOOL)
      const custoAcucar = ref.acucar_kg * getVal(NOME_INSUMO.ACUCAR)
      
      // Fruta (Lógica Diferenciada)
      let custoFrutaBase = 0
      let nomeFruta = ''
      
      if (tipo === 'L') {
          custoFrutaBase = parseFloat(custoLimao.replace(',', '.')) || 0
          nomeFruta = 'Limão Siciliano'
      } else {
          custoFrutaBase = parseFloat(custoLaranja.replace(',', '.')) || 0
          nomeFruta = 'Laranja'
      }
      
      // Regra: 750ml = Custo Cheio | 375ml = Metade
      const custoFruta = tamanho === 750 ? custoFrutaBase : (custoFrutaBase / 2)

      const totalLiquido = custoAlcool + custoAcucar + custoFruta

      // 3. Rateio (Custos Fixos)
      const totalDespesas = Object.values(despesas).reduce((acc, val) => acc + (parseFloat(val.replace(',', '.')) || 0), 0)
      const qtdGarrafas = parseFloat(garrafasVendidas.replace(',', '.')) || 0
      const custoFixoPorGarrafa = qtdGarrafas > 0 ? (totalDespesas / qtdGarrafas) : 0

      // TOTAL FINAL
      const totalFinal = totalEmbalagem + totalLiquido + custoFixoPorGarrafa

      return {
          titulo,
          corBg,
          total: totalFinal,
          liquido: { total: totalLiquido, custoAlcool, volAlcool: ref.alcool_ml, custoAcucar, volAcucar: ref.acucar_kg, custoFruta, nomeFruta },
          embalagem: { total: totalEmbalagem, garrafa, tampa, lacre, selo, rotulo },
          fixo: custoFixoPorGarrafa
      }
  }

  const abrirDetalhes = (tipo: 'L'|'A', tam: 750|375, titulo: string, cor: string) => {
      const data = getDetalhes(tipo, tam, titulo, cor)
      setDetailData(data)
  }

  if (loading) return <div className="p-8 text-gray-400 font-bold animate-pulse">Carregando dados...</div>

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Custos & Despesas</h1>
            <p className="text-gray-500 mt-2 text-sm">Gerencie os custos de matéria-prima e despesas fixas da empresa.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${showInfo ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
                <InfoIcon />
                {showInfo ? 'Ocultar Explicação' : 'Entenda o Cálculo'}
            </button>
            <button 
                onClick={handleSalvarTudo} 
                disabled={saving}
                className="flex-1 md:flex-none bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 text-xs"
            >
                {saving ? 'Salvando...' : 'Salvar Tudo'}
            </button>
        </div>
      </div>

      {showInfo && (
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-blue-900 mb-8 animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Composição Detalhada do Custo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs bg-white/60 p-4 rounded-xl">
                  <div> 
                      <span className="font-bold uppercase text-blue-600 block mb-2">1. Líquido (Ficha Técnica)</span>
                      <ul className="space-y-2 text-gray-600">
                          <li>• <strong>Álcool (29,17%):</strong> O sistema calcula exatamente <strong>218,78ml</strong> (Garrafa 750ml) ou <strong>109,39ml</strong> (Garrafa 375ml).</li>
                          <li>• <strong>Açúcar (Xarope):</strong> Considera <strong>183g</strong> (750ml) ou <strong>91,5g</strong> (375ml) por unidade.</li>
                          <li>• <strong>Fruta:</strong> Custo da fruta para a garrafa de 750ml, e metade para 375ml.</li>
                      </ul>
                  </div>
                  <div>
                      <span className="font-bold uppercase text-blue-600 block mb-2">2. Embalagem (Custo Direto)</span>
                      <ul className="space-y-2 text-gray-600">
                          <li>• Soma exata dos custos unitários de compra inseridos:</li>
                          <li className="font-medium">Garrafa + Tampa + Rótulo + Lacre + Selo.</li>
                      </ul>
                  </div>
                  <div>
                      <span className="font-bold uppercase text-purple-600 block mb-2">3. Rateio Operacional</span>
                      <ul className="space-y-2 text-gray-600">
                          <li>• <strong>Fórmula:</strong> (Soma de Todas as Despesas Fixas) ÷ (Previsão de Vendas).</li>
                      </ul>
                  </div>
              </div>
          </div>
      )}

      {/* CARDS DE PREÇO FINAL (CLICÁVEIS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <CardPreco 
            titulo="Limoncello 750ml" 
            cor="border-yellow-200" 
            total={getDetalhes('L', 750, '', '').total}
            onClick={() => abrirDetalhes('L', 750, 'Limoncello 750ml', 'bg-yellow-50')}
        />
        <CardPreco 
            titulo="Limoncello 375ml" 
            cor="border-yellow-200" 
            total={getDetalhes('L', 375, '', '').total}
            onClick={() => abrirDetalhes('L', 375, 'Limoncello 375ml', 'bg-yellow-50')}
        />
        <CardPreco 
            titulo="Arancello 750ml" 
            cor="border-orange-200" 
            total={getDetalhes('A', 750, '', '').total}
            onClick={() => abrirDetalhes('A', 750, 'Arancello 750ml', 'bg-orange-50')}
        />
        <CardPreco 
            titulo="Arancello 375ml" 
            cor="border-orange-200" 
            total={getDetalhes('A', 375, '', '').total}
            onClick={() => abrirDetalhes('A', 375, 'Arancello 375ml', 'bg-orange-50')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* MATÉRIA PRIMA */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-bold text-gray-900 text-sm">Matéria Prima (Custo Unitário)</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                 {/* Input de Limão (Novo) */}
                 <InputMoney 
                    label="Limão (Custo p/ 750ml)" 
                    val={custoLimao} 
                    onChange={setCustoLimao} 
                    onSave={salvarFrutas} 
                    placeholder="0.00" 
                 />
                 
                 {/* Input de Laranja (Novo) */}
                 <InputMoney 
                    label="Laranja (Custo p/ 750ml)" 
                    val={custoLaranja} 
                    onChange={setCustoLaranja} 
                    onSave={salvarFrutas} 
                    placeholder="0.00" 
                 />
                 
                 {insumos.map((item) => (
                     <InputMoney 
                        key={item.id}
                        label={`${item.nome} (${item.unidade})`}
                        val={precos[item.nome] || ''}
                        onChange={(v: string) => handlePrecoChange(item.nome, v)}
                        onSave={() => salvarInsumoUnico(item)}
                     />
                 ))}
              </div>
          </section>

          {/* DESPESAS FIXAS */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-bold text-gray-900 text-sm">Despesas Fixas / Operacionais</h2>
              </div>
              <div className="p-6">
                
                {/* NOVO INPUT: Vendas Mensais (Simulação) */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-2">Simulação: Vendas no Mês</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={garrafasVendidas}
                            onChange={e => setGarrafasVendidas(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-purple-200 rounded-xl font-black text-purple-900 outline-none focus:border-purple-500 text-lg"
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 uppercase">Garrafas</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputMoney label="Aluguel" val={despesas.aluguel} onChange={(v: string) => handleDespesaChange('aluguel', v)} onSave={() => salvarDespesaUnica('aluguel')} />
                    <InputMoney label="Energia (Luz)" val={despesas.luz} onChange={(v: string) => handleDespesaChange('luz', v)} onSave={() => salvarDespesaUnica('luz')} />
                    <InputMoney label="Água" val={despesas.agua} onChange={(v: string) => handleDespesaChange('agua', v)} onSave={() => salvarDespesaUnica('agua')} />
                    <InputMoney label="Contador" val={despesas.contador} onChange={(v: string) => handleDespesaChange('contador', v)} onSave={() => salvarDespesaUnica('contador')} />
                    <InputMoney label="Responsável Técnico" val={despesas.rt} onChange={(v: string) => handleDespesaChange('rt', v)} onSave={() => salvarDespesaUnica('rt')} />
                    <InputMoney label="Contrib. Social" val={despesas.contribSocial} onChange={(v: string) => handleDespesaChange('contribSocial', v)} onSave={() => salvarDespesaUnica('contribSocial')} />
                    <InputMoney label="Tributos (Diversos)" val={despesas.tributos} onChange={(v: string) => handleDespesaChange('tributos', v)} onSave={() => salvarDespesaUnica('tributos')} />
                    {/* mostra total das despesas */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-900 uppercase mb-1">Total das Despesas</label>
                        <div className="w-full p-3 bg-blue-50 border border-gray-200 rounded-xl font-bold text-gray-900">
                            R$ {Object.values(despesas).reduce((acc, val) => acc + (parseFloat(val.replace(',', '.')) || 0), 0).toFixed(2)}
                        </div>
                    </div>
                </div>
              </div>
          </section>

      </div>

      <ModalDetalhes data={detailData} onClose={() => setDetailData(null)} />
      <ModalAlerta
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        type={alerta.type}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </>
  )
}