"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useMasks } from '@/lib/useMasks'
import { ModalAlerta } from './ModalAlerta'

export function ClientesList({ initialClientes }: { initialClientes: any[] }) {
  const router = useRouter()
  const { formatPhoneNumber, formatCPF, formatCNPJ, formatCEP } = useMasks()
  const [clientes, setClientes] = useState(initialClientes)
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'error' as const })
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estado de Edição
  const [modoEdicao, setModoEdicao] = useState(false) 
  const [idEdicao, setIdEdicao] = useState<string | null>(null)

  // Estado do Histórico (usado apenas dentro do modal)
  const [historicoVendas, setHistoricoVendas] = useState<any[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // === BUSCA ===
  const [busca, setBusca] = useState('')

  // Filtra clientes pelo nome (busca)
  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  // === CAMPOS DO FORMULÁRIO ===
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipo, setTipo] = useState('PF') 
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('Florianópolis')
  const [estado, setEstado] = useState('SC')
  const [complemento, setComplemento] = useState('')

  const [buscandoDados, setBuscandoDados] = useState(false)

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

  const handleDocChange = async (v: string) => {
      if (tipo === 'PF') {
          setCpfCnpj(formatCPF(v))
      } else {
          const formatted = formatCNPJ(v)
          setCpfCnpj(formatted)

          const limpo = v.replace(/\D/g, '')
          if (limpo.length === 14) {
              setBuscandoDados(true)
              try {
                  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`)
                  const data = await res.json()
                  
                  if (!data.message) { 
                      if(!nome) setNome(data.razao_social || data.nome_fantasia)
                      setCep(data.cep || '')
                      setEndereco(data.logradouro || '')
                      setNumero(data.numero || '')
                      setBairro(data.bairro || '')
                      setCidade(data.municipio || '')
                      setEstado(data.uf || '')
                      setComplemento(data.complemento || '')
                      if(!data.numero) document.getElementById('inputNumero')?.focus()
                  }
              } catch (error) {
                  console.error("Erro ao buscar CNPJ", error)
              } finally {
                  setBuscandoDados(false)
              }
          }
      }
  }

  const buscarCep = async (cepInput: string) => {
    const cepLimpo = cepInput.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
        setBuscandoDados(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setEndereco(data.logradouro)
                setBairro(data.bairro)
                setCidade(data.localidade)
                setEstado(data.uf)
                document.getElementById('inputNumero')?.focus()
            }
        } catch (e) {
            console.error("Erro CEP", e)
        } finally {
            setBuscandoDados(false)
        }
    }
  }

  // === AÇÕES ===

  const abrirNovo = () => {
    setModoEdicao(false)
    setIdEdicao(null)
    setHistoricoVendas([])
    limparForm()
    setIsModalOpen(true)
  }

  const abrirCliente = async (c: any) => {
    setModoEdicao(true)
    setIdEdicao(c.id)
    setNome(c.nome); setTelefone(c.telefone || ''); setTipo(c.tipo || 'PF')
    setEmail(c.email || ''); setCpfCnpj(c.cpf_cnpj || '')
    setInscricaoEstadual(c.inscricao_estadual || '')
    
    setCep(c.cep || ''); setEndereco(c.endereco || ''); setNumero(c.numero || '')
    setBairro(c.bairro || ''); setCidade(c.cidade || ''); setEstado(c.estado || '')
    setComplemento(c.complemento || '')
    
    setIsModalOpen(true)

    setLoadingHistorico(true)
    try {
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                id, data_venda, valor_total, pago,
                itens_venda (produto, tamanho, quantidade)
            `)
            .eq('cliente_id', c.id)
            .order('data_venda', { ascending: false })
        
        if (!error && data) {
            setHistoricoVendas(data)
        }
    } catch (err) {
        console.error("Erro histórico", err)
    } finally {
        setLoadingHistorico(false)
    }
  }

  const limparForm = () => {
    setNome(''); setTelefone(''); setTipo('PF'); setEmail(''); setCpfCnpj(''); setInscricaoEstadual('')
    setCep(''); setEndereco(''); setNumero(''); setBairro(''); setCidade('Florianópolis'); setEstado('SC'); setComplemento('')
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
        nome, telefone, tipo, email, cpf_cnpj: cpfCnpj,
        inscricao_estadual: tipo === 'PJ' ? inscricaoEstadual : null,
        cep, endereco, numero, bairro, cidade, estado, complemento
    }

    try {
        if (modoEdicao && idEdicao) {
            const { error } = await supabase.from('Cliente').update(payload).eq('id', idEdicao)
            if (error) throw error
            // Preserva a contagem de vendas ao atualizar a lista local
            const vendasCount = clientes.find(c => c.id === idEdicao)?.vendas
            setClientes(clientes.map(c => c.id === idEdicao ? { ...c, ...payload, vendas: vendasCount } : c))
            setAlerta({ isOpen: true, title: 'Sucesso', message: 'Cliente atualizado!', type: 'success' })
        } else {
            const { data: novo, error } = await supabase.from('Cliente').insert(payload).select().single()
            if (error) throw error
            // Novo cliente começa com 0 vendas
            setClientes([...clientes, { ...novo, vendas: [{ count: 0 }] }].sort((a,b) => a.nome.localeCompare(b.nome)))
            setAlerta({ isOpen: true, title: 'Sucesso', message: 'Cliente cadastrado!', type: 'success' })
        }
        setIsModalOpen(false)
        router.refresh()
    } catch (err: any) {
        setAlerta({ isOpen: true, title: 'Erro', message: `Erro: ${err.message}`, type: 'error' })
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full md:w-1/3">
            <input 
                type="text" 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente por nome..." 
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 shadow-sm"
            />
        </div>
        
        <button onClick={abrirNovo} className="bg-black  hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 w-full md:w-auto justify-center">
            <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* LISTA DESKTOP */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fiscal / Contato</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Endereço</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientesFiltrados.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</td>
                    </tr>
                )}
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} onClick={() => abrirCliente(cliente)} className="hover:bg-blue-50 cursor-pointer transition-colors groupCursor-pointer">
                    <td className="p-4">
                        <span className="block font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{cliente.nome}</span>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{cliente.tipo}</span>
                            {/* CONTADOR DE VENDAS */}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                {cliente.vendas?.length || 0} compras
                            </span>
                        </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                        <div className="font-mono">{cliente.telefone || '-'}</div>
                        <div className="text-xs text-gray-400">{cliente.email}</div>
                        {cliente.cpf_cnpj && <div className="text-xs font-bold bg-yellow-50 text-yellow-700 px-1 rounded inline-block mt-1">{cliente.cpf_cnpj}</div>}
                    </td>
                    <td className="p-4 text-sm text-gray-500 truncate max-w-[200px]">
                        {cliente.endereco ? `${cliente.endereco}, ${cliente.numero}` : '-'}
                        {cliente.bairro && <div className="text-xs text-gray-400">{cliente.bairro} - {cliente.cidade}</div>}
                    </td>
                    <td className="p-4 text-right text-gray-300 group-hover:text-blue-500">➔</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* LISTA MOBILE */}
      <div className="md:hidden space-y-4">
        {clientesFiltrados.length === 0 && <p className="text-center text-gray-400">Nenhum cliente encontrado.</p>}
        
        {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} onClick={() => abrirCliente(cliente)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{cliente.nome}</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{cliente.tipo}</span>
                            {/* CONTADOR DE VENDAS MOBILE */}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                {cliente.vendas?.length || 0} compras
                            </span>
                        </div>
                    </div>
                    <span className="text-gray-300 font-bold">➔</span>
                </div>
                <div className="space-y-1 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><span>📞</span> <span className="font-mono">{cliente.telefone || 'Sem telefone'}</span></div>
                    {cliente.endereco && (<div className="flex items-start gap-2 text-sm text-gray-600"><span>📍</span> <span>{cliente.endereco}, {cliente.numero}</span></div>)}
                </div>
            </div>
        ))}
      </div>

      {/* MODAL (Sem alterações) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-2xl font-black text-gray-900">{modoEdicao ? 'Ficha do Cliente' : 'Novo Cliente'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black font-bold p-2 text-xl ">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSalvar} className="space-y-8">
                        {/* DADOS CADASTRAIS */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados Principais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            Nome / Razão Social *
                                            {buscandoDados && <span className="text-blue-500 ml-2 animate-pulse font-normal lowercase">(buscando...)</span>}
                                        </label>
                                        <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900" placeholder="Digite o nome..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp *</label>
                                        <input required value={telefone} onChange={e => setTelefone(formatPhoneNumber(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tipo *</label>
                                        <select value={tipo} onChange={e => { setTipo(e.target.value); setCpfCnpj(''); setInscricaoEstadual('') }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900 ">
                                            <option value="PF">Pessoa Física</option>
                                            <option value="PJ">Pessoa Jurídica</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">
                                    Dados Fiscais & Endereço 
                                    {buscandoDados && <span className="text-blue-500 ml-2 animate-pulse font-normal normal-case float-right">Consultando dados...</span>}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">{tipo === 'PF' ? 'CPF' : 'CNPJ (busca automática)'}</label>
                                        <input value={cpfCnpj} onChange={e => handleDocChange(e.target.value)} maxLength={tipo === 'PF' ? 14 : 18} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black font-mono text-gray-900 placeholder-gray-300" placeholder={tipo === 'PJ' ? 'Digite para buscar...' : ''} />
                                    </div>

                                    {tipo === 'PJ' && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Inscrição Estadual</label>
                                            <input value={inscricaoEstadual} onChange={e => setInscricaoEstadual(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 placeholder-gray-300" placeholder="Isento ou Nº" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">CEP</label>
                                        <input value={cep} onChange={e => { setCep(formatCEP(e.target.value)); if(e.target.value.length >= 8) buscarCep(e.target.value) }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Endereço</label>
                                        <input value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                                        <input id="inputNumero" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                                        <input value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                                        <input value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">UF</label>
                                        <input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black uppercase text-gray-900" />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Complemento</label>
                                        <input value={complemento} onChange={e => setComplemento(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="Apto, Sala, Ponto de referência..." />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 ">
                                {loading ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Cadastrar Cliente')}
                            </button>
                        </div>

                        {/* HISTÓRICO VISUAL */}
                        {modoEdicao && (
                            <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-8">
                                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                    📜 Histórico de Compras — <span className="text-gray-800 font-normal">{historicoVendas.length}</span>
                                    {loadingHistorico && <span className="text-xs text-gray-400 font-normal animate-pulse">(Carregando...)</span>}
                                </h3>
                                
                                <div className="space-y-3">
                                    {!loadingHistorico && historicoVendas.length === 0 && (
                                        <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-400 italic">
                                            Nenhuma compra registrada para este cliente.
                                        </div>
                                    )}

                                    {historicoVendas.map(venda => (
                                        <div key={venda.id} onClick={() => router.push(`/vendas/${venda.id}`)} className="bg-white border border-gray-200 p-4 rounded-xl hover:border-blue-300 hover:bg-blue-50  transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group shadow-sm cursor-pointer">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">#{venda.id}</span>
                                                    <span className="text-xs text-gray-400 font-bold uppercase">{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-800 space-y-0.5">
                                                    {venda.itens_venda && venda.itens_venda.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            <span className="font-bold text-black">{item.quantidade}x</span>
                                                            <span>{capitalize(item.produto)}</span>
                                                            <span className="text-gray-400 text-xs">{item.tamanho}ml</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right w-full md:w-auto border-t md:border-0 border-gray-100 pt-2 md:pt-0 mt-2 md:mt-0 flex justify-between md:block items-center">
                                                <span className="block text-lg font-black text-green-600">R$ {venda.valor_total.toFixed(2)}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${venda.pago ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{venda.pago ? 'PAGO' : 'PENDENTE'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
      )}

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