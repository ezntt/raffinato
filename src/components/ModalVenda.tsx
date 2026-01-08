"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PRECO_PADRAO } from '@/lib/constants'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalVenda({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Dados do Cliente
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoCliente, setTipoCliente] = useState('consumidor')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<string | null>(null)
  
  // Autocomplete
  const [listaClientes, setListaClientes] = useState<any[]>([])
  const [sugestoes, setSugestoes] = useState<any[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  // Venda & Preços
  const [pago, setPago] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [precoUnit750, setPrecoUnit750] = useState<number | string>(PRECO_PADRAO.GARRAFA_750)
  const [precoUnit375, setPrecoUnit375] = useState<number | string>(PRECO_PADRAO.GARRAFA_375)
  const [valorTotal, setValorTotal] = useState<number | string>('')

  // Quantidades e Lotes
  const [qtdL750, setQtdL750] = useState<number | string>('')
  const [qtdL375, setQtdL375] = useState<number | string>('')
  const [qtdA750, setQtdA750] = useState<number | string>('')
  const [qtdA375, setQtdA375] = useState<number | string>('')
  const [lotesDisponiveis, setLotesDisponiveis] = useState<any[]>([])
  const [loteL750, setLoteL750] = useState<string>('')
  const [loteL375, setLoteL375] = useState<string>('')
  const [loteA750, setLoteA750] = useState<string>('')
  const [loteA375, setLoteA375] = useState<string>('')

  // === MÁSCARAS ===
  const formatarTelefone = (v: string) => {
    let val = v.replace(/\D/g, "").substring(0, 11)
    if (val.length > 10) return val.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
    if (val.length > 5) return val.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    if (val.length > 2) return val.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2")
    return val ? val.replace(/^(\d*)/, "($1") : ""
  }

  const maskCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length <= 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    return v.substring(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  // === LOAD ===
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: lotes } = await supabase.from('Lote').select('id, produto, estoque_750, estoque_375').or('estoque_750.gt.0,estoque_375.gt.0')
        if (lotes) setLotesDisponiveis(lotes)

        const { data: clientes } = await supabase.from('Cliente').select('*').order('nome')
        if (clientes) setListaClientes(clientes)
      }
      fetchData()
    }
  }, [isOpen])

  // === AUTOCOMPLETE ===
  const handleNomeChange = (text: string) => {
    setNome(text)
    setClienteIdSelecionado(null)
    if (text.length > 0) {
      const matches = listaClientes.filter(c => c.nome.toLowerCase().includes(text.toLowerCase()))
      setSugestoes(matches)
      setMostrarSugestoes(true)
    } else {
      setMostrarSugestoes(false)
    }
  }

  const selecionarCliente = (cliente: any) => {
    setNome(cliente.nome)
    setTelefone(cliente.telefone || '')
    setTipoCliente(cliente.tipo || 'consumidor')
    setCpfCnpj(cliente.cpf_cnpj || '')
    setClienteIdSelecionado(cliente.id)
    setMostrarSugestoes(false)
  }

  const getOpcoesLote = (prod: string, tam: number) => {
    return lotesDisponiveis.filter(l => l.produto === prod && (tam === 750 ? l.estoque_750 > 0 : l.estoque_375 > 0))
  }

  const handleNumChange = (valor: string, setFn: any) => {
    if (valor === '') { setFn(''); return }
    const num = parseFloat(valor)
    if (!isNaN(num) && num >= 0) setFn(num)
  }

  useEffect(() => {
    const total = (Number(qtdL750||0) * Number(precoUnit750||0)) + (Number(qtdL375||0) * Number(precoUnit375||0)) + (Number(qtdA750||0) * Number(precoUnit750||0)) + (Number(qtdA375||0) * Number(precoUnit375||0))
    setValorTotal(total > 0 ? total : '') 
  }, [qtdL750, qtdL375, qtdA750, qtdA375, precoUnit750, precoUnit375])

  const validarItem = (nomeProd: string, tam: number, qtdInput: number | string, loteId: string) => {
    const qtd = Number(qtdInput) || 0
    // Se tem quantidade mas não tem lote -> ERRO
    if (qtd > 0 && !loteId) {
        alert(`Selecione o LOTE de origem para ${nomeProd}`)
        return false
    }
    // Se não tem quantidade -> Ignora
    if (qtd <= 0) return true 

    const lote = lotesDisponiveis.find(l => l.id === loteId)
    if (!lote) return true
    
    const estoqueDisponivel = tam === 750 ? lote.estoque_750 : lote.estoque_375
    if (qtd > estoqueDisponivel) {
        alert(`ERRO: Lote ${loteId} de ${nomeProd} só tem ${estoqueDisponivel} unidades.`)
        return false
    }
    return true
  }

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarItem('Limoncello 750ml', 750, qtdL750, loteL750)) return
    if (!validarItem('Limoncello 375ml', 375, qtdL375, loteL375)) return
    if (!validarItem('Arancello 750ml', 750, qtdA750, loteA750)) return
    if (!validarItem('Arancello 375ml', 375, qtdA375, loteA375)) return
    
    // Verifica se tem pelo menos 1 item
    if (!qtdL750 && !qtdL375 && !qtdA750 && !qtdA375) return alert("Adicione pelo menos 1 item")

    setLoading(true)

    try {
      let finalClienteId = clienteIdSelecionado
      if (!finalClienteId) {
        const { data: existente } = await supabase.from('Cliente').select('id').eq('telefone', telefone).single()
        if (existente) {
            finalClienteId = existente.id
            if(cpfCnpj) await supabase.from('Cliente').update({ cpf_cnpj: cpfCnpj }).eq('id', finalClienteId)
        } else {
            const { data: novo } = await supabase.from('Cliente').insert({ nome, telefone, tipo: tipoCliente, cpf_cnpj: cpfCnpj }).select().single()
            finalClienteId = novo.id
        }
      }

      const { data: venda, error: errVenda } = await supabase.from('vendas').insert({ cliente_id: finalClienteId, valor_total: Number(valorTotal), observacao, pago }).select().single()
      if (errVenda) throw errVenda

      const processarItem = async (prod: string, tam: number, qtdStr: string | number, preco: number, loteId: string) => {
        const qtd = Number(qtdStr) || 0
        if (qtd <= 0) return
        
        await supabase.from('itens_venda').insert({ venda_id: venda.id, produto: prod, tamanho: tam, quantidade: qtd, preco_unitario: preco, lote_id: loteId || null })
        
        // REMOVIDO: incrementar_estoque (Legado)
        // AGORA SÓ BAIXA DO LOTE:
        if (loteId) {
            const coluna = tam === 750 ? 'estoque_750' : 'estoque_375'
            await supabase.rpc('baixar_estoque_lote', { p_lote_id: loteId, p_coluna: coluna, p_qtd: qtd })
        }
      }

      await processarItem('limoncello', 750, qtdL750, Number(precoUnit750), loteL750)
      await processarItem('limoncello', 375, qtdL375, Number(precoUnit375), loteL375)
      await processarItem('arancello', 750, qtdA750, Number(precoUnit750), loteA750)
      await processarItem('arancello', 375, qtdA375, Number(precoUnit375), loteA375)

      alert("Venda realizada com sucesso!")
      router.refresh()
      onClose()
      setNome(''); setTelefone(''); setCpfCnpj(''); setClienteIdSelecionado(null);
      setQtdL750(''); setQtdL375(''); setQtdA750(''); setQtdA375('');
      setLoteL750(''); setLoteL375(''); setLoteA750(''); setLoteA375('');
    } catch (error: any) {
      alert("Erro: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const SelectLote = ({ prod, tam, val, setVal }: any) => {
    const ops = getOpcoesLote(prod, tam)
    return (
      <select value={val} onChange={e => setVal(e.target.value)} className="text-[10px] bg-white border border-gray-200 rounded p-1 w-full mt-1 outline-none focus:border-black text-gray-900 cursor-pointer">
        <option value="">-- Selecione Lote --</option>
        {ops.map(l => <option key={l.id} value={l.id}>Lote {l.id} (Disp: {tam === 750 ? l.estoque_750 : l.estoque_375})</option>)}
      </select>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-3xl p-8 w-full max-w-5xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-3xl font-black text-gray-900 mb-1">Nova Venda 💰</h2></div>
            <button onClick={onClose} className="text-gray-400 hover:text-black font-bold p-2 text-xl cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleVenda} className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* ESQUERDA */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Dados do Cliente</span>
                        
                        <div className="relative">
                            <input required placeholder="Nome do Cliente (Digite para buscar)" value={nome} onChange={e => handleNomeChange(e.target.value)} onFocus={() => nome && setMostrarSugestoes(true)} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
                            {mostrarSugestoes && sugestoes.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-40 overflow-y-auto">
                                    {sugestoes.map(cli => (
                                        <li key={cli.id} onClick={() => selecionarCliente(cli)} className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-900 text-sm">{cli.nome}</span>
                                                <div className="flex gap-2">
                                                    {cli.cpf_cnpj && <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded font-mono">{cli.cpf_cnpj}</span>}
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cli.tipo === 'restaurante' ? 'bg-purple-100 text-purple-700' : cli.tipo === 'emporio' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{cli.tipo}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">{cli.telefone}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <input required placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(formatarTelefone(e.target.value))} className="w-2/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold placeholder-gray-400" />
                            <select value={tipoCliente} onChange={e => setTipoCliente(e.target.value)} className="w-1/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-bold cursor-pointer">
                                <option value="consumidor">Pessoa</option>
                                <option value="emporio">Empório</option>
                                <option value="restaurante">Restaurante</option>
                            </select>
                        </div>
                        
                        <div>
                            <input 
                                placeholder="CPF / CNPJ (Opcional para Nota)" 
                                value={cpfCnpj} 
                                onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))} 
                                className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-gray-900 font-mono placeholder-gray-400" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex-1"><label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 750ml</label><input type="number" value={precoUnit750} onChange={e => handleNumChange(e.target.value, setPrecoUnit750)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 outline-none focus:ring-2 ring-blue-200" /></div>
                        <div className="flex-1"><label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 375ml</label><input type="number" value={precoUnit375} onChange={e => handleNumChange(e.target.value, setPrecoUnit375)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 outline-none focus:ring-2 ring-blue-200" /></div>
                    </div>
                </div>

                {/* DIREITA */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-3 rounded-xl hover:border-yellow-400 transition-colors shadow-sm">
                            <div className="w-24 text-right pt-2"><span className="block font-black text-gray-900 uppercase text-sm">Limoncello</span></div>
                            <div className="flex-1 flex gap-2">
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdL750} onChange={e => handleNumChange(e.target.value, setQtdL750)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-gray-900 text-center outline-none focus:bg-yellow-50 focus:text-yellow-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">750ml</span><SelectLote prod="limoncello" tam={750} val={loteL750} setVal={setLoteL750} /></div>
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdL375} onChange={e => handleNumChange(e.target.value, setQtdL375)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-gray-900 text-center outline-none focus:bg-yellow-50 focus:text-yellow-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">375ml</span><SelectLote prod="limoncello" tam={375} val={loteL375} setVal={setLoteL375} /></div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-3 rounded-xl hover:border-orange-400 transition-colors shadow-sm">
                            <div className="w-24 text-right pt-2"><span className="block font-black text-gray-900 uppercase text-sm">Arancello</span></div>
                            <div className="flex-1 flex gap-2">
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdA750} onChange={e => handleNumChange(e.target.value, setQtdA750)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-gray-900 text-center outline-none focus:bg-orange-50 focus:text-orange-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">750ml</span><SelectLote prod="arancello" tam={750} val={loteA750} setVal={setLoteA750} /></div>
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdA375} onChange={e => handleNumChange(e.target.value, setQtdA375)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-gray-900 text-center outline-none focus:bg-orange-50 focus:text-orange-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">375ml</span><SelectLote prod="arancello" tam={375} val={loteA375} setVal={setLoteA375} /></div>
                            </div>
                        </div>
                    </div>

                    <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-gray-900 font-medium h-20 resize-none" />

                    <div className="mt-auto bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Pagamento</span><span className={`text-sm font-black ${pago ? 'text-green-600' : 'text-red-500'}`}>{pago ? 'PAGO' : 'PENDENTE'}</span></div>
                            <button type="button" onClick={() => setPago(!pago)} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${pago ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${pago ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                         </div>
                         
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">R$</span>
                                <input type="number" step="0.01" required value={valorTotal} onChange={e => handleNumChange(e.target.value, setValorTotal)} className="w-full pl-12 p-4 bg-white border-2 border-green-200 focus:border-green-500 rounded-xl outline-none font-black text-3xl text-green-900" placeholder="0.00" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:flex-1 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg disabled:opacity-50 cursor-pointer">
                                {loading ? '...' : 'Confirmar Venda'}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </form>
      </div>
    </div>
  )
}