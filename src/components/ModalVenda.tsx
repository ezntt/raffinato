"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PRECO_PADRAO, NOME_INSUMO } from '@/lib/constants'
import { useMasks } from '@/lib/useMasks'
import { ModalAlerta } from './ModalAlerta'
import type { AlertType } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalVenda({ isOpen, onClose }: Props) {
  const router = useRouter()
  const { formatPhoneNumber, formatCPF, formatCNPJ } = useMasks()
  const [loading, setLoading] = useState(false)
  const [buscandoDados, setBuscandoDados] = useState(false)
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })

  // Dados do Cliente (Visíveis)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipoCliente, setTipoCliente] = useState('PF') 
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<string | null>(null)
  
  // Dados do Cliente (Invisíveis/Background para salvar no banco)
  const [dadosExtras, setDadosExtras] = useState({
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: ''
  })
  
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

  // Quantidades Produtos
  const [qtdL750, setQtdL750] = useState<number | string>('')
  const [qtdL375, setQtdL375] = useState<number | string>('')
  const [qtdA750, setQtdA750] = useState<number | string>('')
  const [qtdA375, setQtdA375] = useState<number | string>('')

  // Lotes
  const [lotesDisponiveis, setLotesDisponiveis] = useState<any[]>([])
  const [loteL750, setLoteL750] = useState<string>('')
  const [loteL375, setLoteL375] = useState<string>('')
  const [loteA750, setLoteA750] = useState<string>('')
  const [loteA375, setLoteA375] = useState<string>('')

  // Embalagens
  const [qtdSacolas, setQtdSacolas] = useState<number | string>('')
  const [qtdCaixas, setQtdCaixas] = useState<number | string>('')
  const [qtdVeludo, setQtdVeludo] = useState<number | string>('')
  
  const [estoqueEmbalagem, setEstoqueEmbalagem] = useState({ 
      sacola: 0, caixa: 0, veludo: 0,
      idSacola: '', idCaixa: '', idVeludo: '' 
  })

  // Mask de telefone
  // Mask de PF e PJ + BUSCA CNPJ
  const handleDocChange = async (v: string) => {
    const limpo = v.replace(/\D/g, "")
    
    if (tipoCliente === 'PF') {
        setCpfCnpj(formatCPF(v))
    } else {
        setCpfCnpj(formatCNPJ(v))

        // BUSCA AUTOMÁTICA CNPJ
        if (limpo.length === 14) {
            setBuscandoDados(true)
            try {
                const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`)
                const data = await res.json()
                
                if (!data.message) { 
                    // 1. Preenche Nome visível
                    if(!nome) setNome(data.nome_fantasia || data.razao_social || '')
                    
                    // 2. Guarda Endereço "Escondido" para salvar no banco
                    setDadosExtras({
                        cep: data.cep || '',
                        endereco: data.logradouro || '',
                        numero: data.numero || '',
                        bairro: data.bairro || '',
                        cidade: data.municipio || '',
                        estado: data.uf || '',
                        complemento: data.complemento || ''
                    })
                }
            } catch (error) {
                console.error("Erro busca CNPJ", error)
            } finally {
                setBuscandoDados(false)
            }
        }
    }
  }

  // === LOAD ===
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: lotes } = await supabase.from('Lote').select('id, produto, estoque_750, estoque_375').or('estoque_750.gt.0,estoque_375.gt.0')
        if (lotes) setLotesDisponiveis(lotes)

        const { data: clientes } = await supabase.from('Cliente').select('*').order('nome')
        if (clientes) setListaClientes(clientes)

        const { data: insumos } = await supabase.from('Insumo').select('id, nome, quantidade_atual').in('nome', [NOME_INSUMO.SACOLA, NOME_INSUMO.CAIXA_DE_PAPELAO, NOME_INSUMO.EMBALAGEM_VELUDO])
        if (insumos) {
            const sacola = insumos.find(i => i.nome === NOME_INSUMO.SACOLA)
            const caixa = insumos.find(i => i.nome === NOME_INSUMO.CAIXA_DE_PAPELAO)
            const veludo = insumos.find(i => i.nome === NOME_INSUMO.EMBALAGEM_VELUDO)
            
            setEstoqueEmbalagem({
                sacola: sacola?.quantidade_atual || 0,
                caixa: caixa?.quantidade_atual || 0,
                veludo: veludo?.quantidade_atual || 0,
                idSacola: sacola?.id || '',
                idCaixa: caixa?.id || '',
                idVeludo: veludo?.id || ''
            })
        }
        
        // Resetar form
        setTipoCliente('PF')
        setCpfCnpj('')
        setQtdSacolas('')
        setQtdCaixas('')
        setQtdVeludo('')
        setDadosExtras({ cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '' })
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
    setTipoCliente(cliente.tipo || 'PF')
    setCpfCnpj(cliente.cpf_cnpj || '')
    setClienteIdSelecionado(cliente.id)
    setMostrarSugestoes(false)
    // Se o cliente já existe, não precisamos setar dadosExtras, pois não vamos dar update no endereço dele aqui
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
    if (qtd > 0 && !loteId) {
        setAlerta({ isOpen: true, title: 'Erro', message: `Selecione o LOTE de origem para ${nomeProd}`, type: 'error' })
        return false
    }
    if (qtd <= 0) return true 

    const lote = lotesDisponiveis.find(l => l.id === loteId)
    if (!lote) return true
    
    const estoqueDisponivel = tam === 750 ? lote.estoque_750 : lote.estoque_375
    if (qtd > estoqueDisponivel) {
        setAlerta({ isOpen: true, title: 'Erro', message: `ERRO: Lote ${loteId} de ${nomeProd} só tem ${estoqueDisponivel} unidades.`, type: 'error' })
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
    
    if (!qtdL750 && !qtdL375 && !qtdA750 && !qtdA375) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Adicione pelo menos 1 item', type: 'error' })
      return
    }

    const qSacola = Number(qtdSacolas) || 0
    const qCaixa = Number(qtdCaixas) || 0
    const qVeludo = Number(qtdVeludo) || 0

    // Verificar estoques de embalagem (com confirmações)
    const avisos = []
    if (qSacola > estoqueEmbalagem.sacola) avisos.push(`Estoque de Sacolas insuficiente (${estoqueEmbalagem.sacola})`)
    if (qCaixa > estoqueEmbalagem.caixa) avisos.push(`Estoque de Caixas insuficiente (${estoqueEmbalagem.caixa})`)
    if (qVeludo > estoqueEmbalagem.veludo) avisos.push(`Estoque de Veludo insuficiente (${estoqueEmbalagem.veludo})`)
    
    if (avisos.length > 0) {
      const avisoMensagem = avisos.join('\n')
      if(!confirm(`${avisoMensagem}\n\nContinuar?`)) return
    }

    setLoading(true)

    try {
      // 1. Cliente (Lógica atualizada para salvar Endereço)
      let finalClienteId = clienteIdSelecionado
      if (!finalClienteId) {
        const { data: existente } = await supabase.from('Cliente').select('id').eq('telefone', telefone).single()
        if (existente) {
            finalClienteId = existente.id
            // Atualiza CPF/CNPJ se faltar
            if(cpfCnpj) {
                await supabase.from('Cliente').update({ cpf_cnpj: cpfCnpj, tipo: tipoCliente }).eq('id', finalClienteId)
                await supabase.from('Logs').insert({
                    categoria: 'CLIENTE',
                    acao: 'CLIENTE_ATUALIZADO',
                    descricao: `Cliente ${nome} atualizado - CPF/CNPJ: ${cpfCnpj} (${tipoCliente})`
                })
            }
        } else {
            // CRIA NOVO CLIENTE COM DADOS EXTRAS DO CNPJ (SE HOUVER)
            const { data: novo } = await supabase.from('Cliente').insert({ 
                nome, 
                telefone, 
                tipo: tipoCliente, 
                cpf_cnpj: cpfCnpj,
                // Aqui entram os dados invisíveis capturados do CNPJ
                cep: dadosExtras.cep,
                endereco: dadosExtras.endereco,
                numero: dadosExtras.numero,
                bairro: dadosExtras.bairro,
                cidade: dadosExtras.cidade,
                estado: dadosExtras.estado,
                complemento: dadosExtras.complemento
            }).select().single()
            finalClienteId = novo.id
            
            await supabase.from('Logs').insert({
                categoria: 'CLIENTE',
                acao: 'CLIENTE_CRIADO',
                descricao: `Novo cliente criado: ${nome} (${tipoCliente}) - ${telefone}${cpfCnpj ? ` - ${cpfCnpj}` : ''}`
            })
        }
      }

      // 2. Montar Payload
      const itensVenda = []
      if(Number(qtdL750)>0) itensVenda.push({ produto: 'limoncello', tamanho: 750, quantidade: Number(qtdL750), preco: Number(precoUnit750), lote_id: loteL750 || null })
      if(Number(qtdL375)>0) itensVenda.push({ produto: 'limoncello', tamanho: 375, quantidade: Number(qtdL375), preco: Number(precoUnit375), lote_id: loteL375 || null })
      if(Number(qtdA750)>0) itensVenda.push({ produto: 'arancello', tamanho: 750, quantidade: Number(qtdA750), preco: Number(precoUnit750), lote_id: loteA750 || null })
      if(Number(qtdA375)>0) itensVenda.push({ produto: 'arancello', tamanho: 375, quantidade: Number(qtdA375), preco: Number(precoUnit375), lote_id: loteA375 || null })

      const embalagens = {
          sacola: { id: estoqueEmbalagem.idSacola, qtd: qSacola },
          caixa: { id: estoqueEmbalagem.idCaixa, qtd: qCaixa },
          veludo: { id: estoqueEmbalagem.idVeludo, qtd: qVeludo }
      }

      // 3. RPC
      const { error } = await supabase.rpc('registrar_venda_completa', {
          p_cliente_id: finalClienteId,
          p_valor_total: Number(valorTotal),
          p_observacao: observacao,
          p_pago: pago,
          p_itens: itensVenda,
          p_embalagens: embalagens
      })

      if (error) throw error

      // Log da venda
      const resumoItens = itensVenda.map(i => `${i.quantidade}x ${i.produto} ${i.tamanho}ml`).join(', ')
      await supabase.from('Logs').insert({
          categoria: 'VENDA',
          acao: 'VENDA_REGISTRADA',
          descricao: `Venda R$ ${Number(valorTotal).toFixed(2)} - Cliente: ${nome} - ${itensVenda.length} item(ns): ${resumoItens} - ${pago ? 'PAGO' : 'PENDENTE'}${observacao ? ` - Obs: ${observacao}` : ''}`
      })

      setAlerta({ isOpen: true, title: 'Sucesso', message: 'Venda realizada com sucesso!', type: 'success' })
      router.refresh()
      onClose()
      
      // Limpeza
      setNome(''); setTelefone(''); setCpfCnpj(''); setClienteIdSelecionado(null);
      setQtdL750(''); setQtdL375(''); setQtdA750(''); setQtdA375('');
      setLoteL750(''); setLoteL375(''); setLoteA750(''); setLoteA375('');
      setQtdSacolas(''); setQtdCaixas(''); setQtdVeludo('');
      setDadosExtras({ cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '' })

    } catch (error: any) {
      // Log de erro
      await supabase.from('Logs').insert({
          categoria: 'ERRO',
          acao: 'ERRO_VENDA',
          descricao: `Erro ao registrar venda: ${error.message} - Cliente: ${nome || 'N/A'} - Valor tentado: R$ ${valorTotal || '0'}`
      })
      setAlerta({ isOpen: true, title: 'Erro', message: `Erro: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const SelectLote = ({ prod, tam, val, setVal }: any) => {
    const ops = getOpcoesLote(prod, tam)
    return (
      <select value={val} onChange={e => setVal(e.target.value)} className="text-[10px] bg-white border border-gray-200 rounded p-1 w-full mt-1 outline-none focus:border-black text-gray-900 ">
        <option value="">-- Selecione Lote --</option>
        {ops.map(l => <option key={l.id} value={l.id}>Lote {l.id} (Disp: {tam === 750 ? l.estoque_750 : l.estoque_375})</option>)}
      </select>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-3xl p-8 w-full max-w-5xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-3xl font-black text-gray-900 mb-1">Nova Venda </h2></div>
            <button onClick={onClose} className="text-gray-400 hover:text-black font-bold p-2 text-xl ">✕</button>
        </div>

        <form onSubmit={handleVenda} className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* ESQUERDA - DADOS DO CLIENTE */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Dados do Cliente</span>
                        
                        <div className="relative">
                            <input required placeholder="Nome do Cliente (Digite para buscar)" value={nome} onChange={e => handleNomeChange(e.target.value)} onFocus={() => nome && setMostrarSugestoes(true)} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-black font-bold placeholder-gray-400" />
                            {mostrarSugestoes && sugestoes.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-40 overflow-y-auto">
                                    {sugestoes.map(cli => (
                                        <li key={cli.id} onClick={() => selecionarCliente(cli)} className="p-3 hover:bg-gray-100  border-b border-gray-50 last:border-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-900 text-sm">{cli.nome}</span>
                                                <div className="flex gap-2">
                                                    {cli.cpf_cnpj && <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded font-mono">{cli.cpf_cnpj}</span>}
                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{cli.tipo}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">{cli.telefone}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <input required placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(formatPhoneNumber(e.target.value))} className="w-2/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-black font-bold placeholder-gray-400" />
                            
                            <select 
                                value={tipoCliente} 
                                onChange={e => { setTipoCliente(e.target.value); setCpfCnpj('') }} 
                                className="w-1/3 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-black font-bold "
                            >
                                <option value="PF">PF</option>
                                <option value="PJ">PJ</option>
                            </select>
                        </div>
                        
                        <div>
                            {/* CAMPO DE CNPJ COM FEEDBACK DE BUSCA */}
                            <div className="relative">
                                <input 
                                    placeholder={tipoCliente === 'PF' ? "CPF (Opcional)" : "CNPJ (Busca Auto)"}
                                    value={cpfCnpj} 
                                    onChange={e => handleDocChange(e.target.value)} 
                                    maxLength={tipoCliente === 'PF' ? 14 : 18}
                                    className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-black text-black font-mono placeholder-gray-400" 
                                />
                                {buscandoDados && (
                                    <span className="absolute right-3 top-3.5 text-xs text-blue-500 font-bold animate-pulse">
                                        buscando...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex-1"><label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 750ml</label><input type="number" value={precoUnit750} onChange={e => handleNumChange(e.target.value, setPrecoUnit750)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-black outline-none focus:ring-2 ring-blue-200" /></div>
                        <div className="flex-1"><label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Preço 375ml</label><input type="number" value={precoUnit375} onChange={e => handleNumChange(e.target.value, setPrecoUnit375)} className="w-full p-2 bg-white border border-blue-200 rounded-lg font-bold text-black outline-none focus:ring-2 ring-blue-200" /></div>
                    </div>
                </div>

                {/* DIREITA - PRODUTOS */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-3 rounded-xl hover:border-yellow-400 transition-colors shadow-sm">
                            <div className="w-24 text-right pt-2"><span className="block font-black text-gray-900 uppercase text-sm">Limoncello</span></div>
                            <div className="flex-1 flex gap-2">
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdL750} onChange={e => handleNumChange(e.target.value, setQtdL750)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-black text-center outline-none focus:bg-yellow-50 focus:text-yellow-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">750ml</span><SelectLote prod="limoncello" tam={750} val={loteL750} setVal={setLoteL750} /></div>
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdL375} onChange={e => handleNumChange(e.target.value, setQtdL375)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-black text-center outline-none focus:bg-yellow-50 focus:text-yellow-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">375ml</span><SelectLote prod="limoncello" tam={375} val={loteL375} setVal={setLoteL375} /></div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 bg-white border border-gray-100 p-3 rounded-xl hover:border-orange-400 transition-colors shadow-sm">
                            <div className="w-24 text-right pt-2"><span className="block font-black text-gray-900 uppercase text-sm">Arancello</span></div>
                            <div className="flex-1 flex gap-2">
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdA750} onChange={e => handleNumChange(e.target.value, setQtdA750)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-black text-center outline-none focus:bg-orange-50 focus:text-orange-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">750ml</span><SelectLote prod="arancello" tam={750} val={loteA750} setVal={setLoteA750} /></div>
                                <div className="relative flex-1"><input type="number" placeholder="0" value={qtdA375} onChange={e => handleNumChange(e.target.value, setQtdA375)} className="w-full p-2 pl-12 bg-gray-50 rounded-lg font-black text-black text-center outline-none focus:bg-orange-50 focus:text-orange-900 transition-colors" /><span className="absolute left-2 top-3 text-[10px] font-bold text-gray-400">375ml</span><SelectLote prod="arancello" tam={375} val={loteA375} setVal={setLoteA375} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-3 gap-2">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Sacolas</label>
                                <span className="text-[10px] font-bold text-gray-400">Disp: {estoqueEmbalagem.sacola}</span>
                            </div>
                            <input type="number" placeholder="0" value={qtdSacolas} onChange={e => handleNumChange(e.target.value, setQtdSacolas)} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-center outline-none focus:border-black text-black" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Caixas</label>
                                <span className="text-[10px] font-bold text-gray-400">Disp: {estoqueEmbalagem.caixa}</span>
                            </div>
                            <input type="number" placeholder="0" value={qtdCaixas} onChange={e => handleNumChange(e.target.value, setQtdCaixas)} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-center outline-none focus:border-black text-black" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Veludo</label>
                                <span className="text-[10px] font-bold text-gray-400">Disp: {estoqueEmbalagem.veludo}</span>
                            </div>
                            <input type="number" placeholder="0" value={qtdVeludo} onChange={e => handleNumChange(e.target.value, setQtdVeludo)} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-center outline-none focus:border-black text-black" />
                        </div>
                    </div>

                    <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-black font-medium h-20 resize-none" />

                    <div className="mt-auto bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Pagamento</span><span className={`text-sm font-black ${pago ? 'text-green-600' : 'text-red-500'}`}>{pago ? 'PAGO' : 'PENDENTE'}</span></div>
                            <button type="button" onClick={() => setPago(!pago)} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none  ${pago ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${pago ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                         </div>
                         
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">R$</span>
                                <input type="number" step="0.01" required value={valorTotal} onChange={e => handleNumChange(e.target.value, setValorTotal)} className="w-full pl-12 p-4 bg-white border-2 border-green-200 focus:border-green-500 rounded-xl outline-none font-black text-3xl text-green-900" placeholder="0.00" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:flex-1 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg disabled:opacity-50 ">
                                {loading ? '...' : 'Confirmar Venda'}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </form>

        <ModalAlerta
          isOpen={alerta.isOpen}
          title={alerta.title}
          message={alerta.message}
          type={alerta.type}
          onClose={() => setAlerta({ ...alerta, isOpen: false })}
        />
      </div>
    </div>
  )
}