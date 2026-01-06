"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalVenda({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // === DADOS DA VENDA ===
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoCliente, setTipoCliente] = useState('consumidor')
  const [pago, setPago] = useState(false) // NOVO: Status do pagamento
  
  // === CONFIGURAÇÃO DE PREÇOS ===
  const [precoUnit750, setPrecoUnit750] = useState<number | string>(180)
  const [precoUnit375, setPrecoUnit375] = useState<number | string>(100)

  // === QUANTIDADES ===
  const [qtdL750, setQtdL750] = useState<number | string>('')
  const [qtdL375, setQtdL375] = useState<number | string>('')
  const [qtdA750, setQtdA750] = useState<number | string>('')
  const [qtdA375, setQtdA375] = useState<number | string>('')

  // === TOTAL E OBS ===
  const [valorTotal, setValorTotal] = useState<number | string>('')
  const [observacao, setObservacao] = useState('')

  // Helper numérico
  const handleNumChange = (valor: string, setFn: any) => {
    if (valor === '') { setFn(''); return }
    const num = parseFloat(valor)
    if (!isNaN(num) && num >= 0) setFn(num)
  }

  // === CÁLCULO AUTOMÁTICO ===
  useEffect(() => {
    const qL750 = Number(qtdL750) || 0
    const qL375 = Number(qtdL375) || 0
    const qA750 = Number(qtdA750) || 0
    const qA375 = Number(qtdA375) || 0
    const p750 = Number(precoUnit750) || 0
    const p375 = Number(precoUnit375) || 0

    const totalCalculado = (qL750 * p750) + (qL375 * p375) + (qA750 * p750) + (qA375 * p375)
    
    if (totalCalculado > 0) setValorTotal(totalCalculado)
    else setValorTotal('') 
  }, [qtdL750, qtdL375, qtdA750, qtdA375, precoUnit750, precoUnit375])

  // === VERIFICAÇÃO DE ESTOQUE ===
  const verificarEstoque = async () => {
    const { data: estoque, error } = await supabase.from('Estoque').select('*') // Lembre de conferir se é 'Estoque' ou 'estoque' no seu banco
    if (error) throw new Error("Erro ao consultar estoque.")

    const getDisponivel = (tipo: string, tam: number) => {
      // Ajuste aqui se sua tabela usa maiusculas nos dados (ex: 'Limoncello' vs 'limoncello')
      const item = estoque?.find(e => e.tipo?.toLowerCase() === tipo && e.tamanho === tam)
      return item?.quantidade || 0
    }

    const erros = []
    if ((Number(qtdL750)||0) > getDisponivel('limoncello', 750)) erros.push(`Limoncello 750ml (Disp: ${getDisponivel('limoncello', 750)})`)
    if ((Number(qtdL375)||0) > getDisponivel('limoncello', 375)) erros.push(`Limoncello 375ml (Disp: ${getDisponivel('limoncello', 375)})`)
    if ((Number(qtdA750)||0) > getDisponivel('arancello', 750)) erros.push(`Arancello 750ml (Disp: ${getDisponivel('arancello', 750)})`)
    if ((Number(qtdA375)||0) > getDisponivel('arancello', 375)) erros.push(`Arancello 375ml (Disp: ${getDisponivel('arancello', 375)})`)

    if (erros.length > 0) throw new Error(`Estoque insuficiente:\n- ${erros.join('\n- ')}`)
  }

  // === FINALIZAR VENDA ===
  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const nQtdL750 = Number(qtdL750) || 0
    const nQtdL375 = Number(qtdL375) || 0
    const nQtdA750 = Number(qtdA750) || 0
    const nQtdA375 = Number(qtdA375) || 0
    const nTotal = Number(valorTotal)

    if (nQtdL750 + nQtdL375 + nQtdA750 + nQtdA375 <= 0) {
      alert("Selecione pelo menos uma garrafa.")
      return
    }

    setLoading(true)

    try {
      await verificarEstoque()

      // Cliente
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('Cliente').select('id').eq('telefone', telefone).single() // Verifique se tabela é 'clientes' ou 'Cliente'

      if (clienteExistente) {
        clienteId = clienteExistente.id
      } else {
        const { data: novoCliente, error: erroCli } = await supabase
          .from('Cliente').insert({ nome, telefone, tipo: tipoCliente }).select().single()
        if (erroCli) throw erroCli
        clienteId = novoCliente.id
      }

      // Venda (COM CAMPO PAGO)
      const { data: venda, error: erroVenda } = await supabase
        .from('vendas')
        .insert({ 
            cliente_id: clienteId, 
            valor_total: nTotal, 
            observacao,
            pago: pago // Salva o status
        }).select().single()

      if (erroVenda) throw erroVenda

      // Itens
      const processarItem = async (prod: string, tam: number, qtd: number, preco: number) => {
        if (qtd > 0) {
          await supabase.from('itens_venda').insert({
            venda_id: venda.id, produto: prod, tamanho: tam, quantidade: qtd, preco_unitario: preco
          })
          await supabase.rpc('incrementar_estoque', { p_tipo: prod, p_tamanho: tam, p_qtd: -qtd })
        }
      }

      await processarItem('limoncello', 750, nQtdL750, Number(precoUnit750))
      await processarItem('limoncello', 375, nQtdL375, Number(precoUnit375))
      await processarItem('arancello', 750, nQtdA750, Number(precoUnit750))
      await processarItem('arancello', 375, nQtdA375, Number(precoUnit375))

      alert("Venda realizada com sucesso!")
      router.refresh()
      onClose()
      
      // Limpar
      setNome(''); setTelefone(''); setObservacao(''); setPago(false)
      setQtdL750(''); setQtdL375(''); setQtdA750(''); setQtdA375('')

    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-10 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold p-2">✕</button>

        <h2 className="text-2xl font-black text-gray-900 mb-1">Nova Venda 💰</h2>
        <p className="text-sm text-gray-500 mb-6">Controle de saída e pagamentos.</p>

        <form onSubmit={handleVenda} className="space-y-6">
          
          {/* CLIENTE */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Cliente</span>
            <input required placeholder="Nome do Cliente" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
            <div className="flex gap-3">
              <input required placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-2/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
              <select value={tipoCliente} onChange={e => setTipoCliente(e.target.value)} className="w-1/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold">
                <option value="consumidor">Pessoa</option>
                <option value="emporio">Empório</option>
                <option value="restaurante">Restaurante</option>
              </select>
            </div>
          </div>

          {/* PREÇOS */}
          <div className="flex gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
             <div className="flex-1">
               <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 750ml</label>
               <input type="number" value={precoUnit750} onChange={e => handleNumChange(e.target.value, setPrecoUnit750)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 outline-none focus:ring-2 ring-blue-200" />
             </div>
             <div className="flex-1">
               <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 375ml</label>
               <input type="number" value={precoUnit375} onChange={e => handleNumChange(e.target.value, setPrecoUnit375)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 outline-none focus:ring-2 ring-blue-200" />
             </div>
          </div>

          {/* PRODUTOS (SEM ÍCONES, COM TEXTO CLARO) */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center border border-gray-100 p-3 rounded-xl hover:border-yellow-400 transition-colors">
              <div className="w-24 text-right">
                <span className="block font-black text-gray-900 uppercase text-sm">Limoncello</span>
                <span className="text-[10px] text-gray-400 font-bold tracking-wide">CLÁSSICO</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input type="number" placeholder="750ml" value={qtdL750} onChange={e => handleNumChange(e.target.value, setQtdL750)} className="p-3 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-yellow-400 rounded-xl outline-none font-black text-gray-900 text-center transition-all" />
                <input type="number" placeholder="375ml" value={qtdL375} onChange={e => handleNumChange(e.target.value, setQtdL375)} className="p-3 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-yellow-400 rounded-xl outline-none font-black text-gray-900 text-center transition-all" />
              </div>
            </div>
            
            <div className="flex gap-4 items-center border border-gray-100 p-3 rounded-xl hover:border-orange-400 transition-colors">
              <div className="w-24 text-right">
                <span className="block font-black text-gray-900 uppercase text-sm">Arancello</span>
                <span className="text-[10px] text-gray-400 font-bold tracking-wide">LARANJA</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input type="number" placeholder="750ml" value={qtdA750} onChange={e => handleNumChange(e.target.value, setQtdA750)} className="p-3 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-orange-400 rounded-xl outline-none font-black text-gray-900 text-center transition-all" />
                <input type="number" placeholder="375ml" value={qtdA375} onChange={e => handleNumChange(e.target.value, setQtdA375)} className="p-3 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-orange-400 rounded-xl outline-none font-black text-gray-900 text-center transition-all" />
              </div>
            </div>
          </div>

          <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-gray-900 font-medium" />

          {/* FOOTER: PAGAMENTO + TOTAL + BOTÃO */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase">Status do Pagamento</span>
                <span className={`text-sm font-black ${pago ? 'text-green-600' : 'text-red-500'}`}>
                  {pago ? 'JÁ FOI PAGO' : 'PAGAMENTO PENDENTE'}
                </span>
              </div>
              {/* TOGGLE SWITCH */}
              <button
                type="button"
                onClick={() => setPago(!pago)}
                className={`relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${pago ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${pago ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">R$</span>
              <input type="number" step="0.01" required value={valorTotal} onChange={e => handleNumChange(e.target.value, setValorTotal)} className="w-full pl-12 p-4 bg-green-50 border-2 border-green-100 focus:border-green-500 rounded-xl outline-none font-black text-2xl text-green-900" placeholder="0.00" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
              {loading ? 'Processando...' : 'Confirmar Venda'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}