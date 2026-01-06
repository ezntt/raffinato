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

  // === DADOS DO CLIENTE ===
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoCliente, setTipoCliente] = useState('consumidor') // Novo campo
  
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
    // 1. Busca o estoque atual no banco
    const { data: estoque, error } = await supabase.from('Estoque').select('*')
    if (error) throw new Error("Erro ao consultar estoque.")

    const getDisponivel = (tipo: string, tam: number) => {
      const item = estoque?.find(e => e.tipo === tipo && e.tamanho === tam)
      return item?.quantidade || 0
    }

    // 2. Compara com o que estamos tentando vender
    const erros = []
    
    if ((Number(qtdL750)||0) > getDisponivel('limoncello', 750)) erros.push(`Limoncello 750ml (Disp: ${getDisponivel('limoncello', 750)})`)
    if ((Number(qtdL375)||0) > getDisponivel('limoncello', 375)) erros.push(`Limoncello 375ml (Disp: ${getDisponivel('limoncello', 375)})`)
    if ((Number(qtdA750)||0) > getDisponivel('arancello', 750)) erros.push(`Arancello 750ml (Disp: ${getDisponivel('arancello', 750)})`)
    if ((Number(qtdA375)||0) > getDisponivel('arancello', 375)) erros.push(`Arancello 375ml (Disp: ${getDisponivel('arancello', 375)})`)

    if (erros.length > 0) {
      throw new Error(`Estoque insuficiente para:\n- ${erros.join('\n- ')}`)
    }
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
      // 1. VERIFICAR ESTOQUE ANTES DE TUDO
      await verificarEstoque()

      // 2. Cliente (Busca ou Cria com Tipo)
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('Cliente').select('id').eq('telefone', telefone).single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
        // Opcional: Atualizar o tipo do cliente existente se mudou
        await supabase.from('clientes').update({ tipo: tipoCliente }).eq('id', clienteId)
      } else {
        const { data: novoCliente, error: erroCli } = await supabase
          .from('Cliente').insert({ nome, telefone, tipo: tipoCliente }).select().single()
        if (erroCli) throw erroCli
        clienteId = novoCliente.id
      }

      // 3. Criar Venda
      const { data: venda, error: erroVenda } = await supabase
        .from('vendas')
        .insert({ cliente_id: clienteId, valor_total: nTotal, observacao }).select().single()

      if (erroVenda) throw erroVenda

      // 4. Inserir Itens
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
      setNome(''); setTelefone(''); setObservacao('')
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
        <p className="text-sm text-gray-500 mb-6">Controle de saída e verificação de estoque.</p>

        <form onSubmit={handleVenda} className="space-y-6">
          
          {/* === DADOS DO CLIENTE === */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Cliente</span>
            <input required placeholder="Nome do Cliente" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
            <div className="flex gap-3">
              <input required placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-2/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
              <select 
                value={tipoCliente} 
                onChange={e => setTipoCliente(e.target.value)}
                className="w-1/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold"
              >
                <option value="consumidor">Pessoa</option>
                <option value="emporio">Empório</option>
                <option value="restaurante">Restaurante</option>
              </select>
            </div>
          </div>

          {/* === PREÇOS === */}
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

          {/* === PRODUTOS === */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-lg">🍋</div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input type="number" placeholder="750ml" value={qtdL750} onChange={e => handleNumChange(e.target.value, setQtdL750)} className="p-3 border-2 border-yellow-100 focus:border-yellow-400 rounded-xl outline-none font-black text-gray-900 text-center" />
                <input type="number" placeholder="375ml" value={qtdL375} onChange={e => handleNumChange(e.target.value, setQtdL375)} className="p-3 border-2 border-yellow-100 focus:border-yellow-400 rounded-xl outline-none font-black text-gray-900 text-center" />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-lg">🍊</div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input type="number" placeholder="750ml" value={qtdA750} onChange={e => handleNumChange(e.target.value, setQtdA750)} className="p-3 border-2 border-orange-100 focus:border-orange-400 rounded-xl outline-none font-black text-gray-900 text-center" />
                <input type="number" placeholder="375ml" value={qtdA375} onChange={e => handleNumChange(e.target.value, setQtdA375)} className="p-3 border-2 border-orange-100 focus:border-orange-400 rounded-xl outline-none font-black text-gray-900 text-center" />
              </div>
            </div>
          </div>

          {/* === OBSERVAÇÃO === */}
          <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-gray-900 font-medium" />

          {/* === TOTAL === */}
          <div className="pt-4 border-t border-gray-100">
            <div className="relative mb-4">
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