"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function ClientesList({ initialClientes }: { initialClientes: any[] }) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initialClientes)
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false) // false = Criar, true = Editar
  const [idEdicao, setIdEdicao] = useState<string | null>(null)

  // === CAMPOS DO FORMULÁRIO ===
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipo, setTipo] = useState('consumidor')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  
  // Endereço
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('Florianópolis')
  const [estado, setEstado] = useState('SC')
  const [complemento, setComplemento] = useState('')

  // === MÁSCARAS ===
  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "").substring(0, 11)
    if (v.length > 10) return v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
    if (v.length > 5) return v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    if (v.length > 2) return v.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2")
    return v ? v.replace(/^(\d*)/, "($1") : ""
  }

  const maskCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length <= 11) { // CPF
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else { // CNPJ
        return v.substring(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
  }

  const maskCep = (v: string) => {
    return v.replace(/\D/g, "").substring(0, 8).replace(/^(\d{5})(\d{3})/, "$1-$2")
  }

  // === VIA CEP ===
  const buscarCep = async (cepInput: string) => {
    const cepLimpo = cepInput.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
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
        }
    }
  }

  // === ABRIR MODAL ===
  const abrirNovo = () => {
    setModoEdicao(false)
    setIdEdicao(null)
    limparForm()
    setIsModalOpen(true)
  }

  const abrirEditar = (c: any) => {
    setModoEdicao(true)
    setIdEdicao(c.id)
    setNome(c.nome); setTelefone(c.telefone || ''); setTipo(c.tipo || 'consumidor')
    setEmail(c.email || ''); setCpfCnpj(c.cpf_cnpj || '')
    setCep(c.cep || ''); setEndereco(c.endereco || ''); setNumero(c.numero || '')
    setBairro(c.bairro || ''); setCidade(c.cidade || ''); setEstado(c.estado || '')
    setComplemento(c.complemento || '')
    setIsModalOpen(true)
  }

  const limparForm = () => {
    setNome(''); setTelefone(''); setTipo('consumidor'); setEmail(''); setCpfCnpj('')
    setCep(''); setEndereco(''); setNumero(''); setBairro(''); setCidade('Florianópolis'); setEstado('SC'); setComplemento('')
  }

  // === SALVAR ===
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
        nome, telefone, tipo, email, cpf_cnpj: cpfCnpj,
        cep, endereco, numero, bairro, cidade, estado, complemento
    }

    try {
        if (modoEdicao && idEdicao) {
            const { error } = await supabase.from('Cliente').update(payload).eq('id', idEdicao)
            if (error) throw error
            setClientes(clientes.map(c => c.id === idEdicao ? { ...c, ...payload } : c))
            alert("Cliente atualizado!")
        } else {
            const { data: novo, error } = await supabase.from('Cliente').insert(payload).select().single()
            if (error) throw error
            setClientes([...clientes, novo].sort((a,b) => a.nome.localeCompare(b.nome)))
            alert("Cliente cadastrado!")
        }
        setIsModalOpen(false)
        router.refresh()
    } catch (err: any) {
        alert("Erro: " + err.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
            onClick={abrirNovo}
            className="bg-black cursor-pointer hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 w-full md:w-auto justify-center"
        >
            <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* === VERSÃO DESKTOP (TABELA) - Escondida no Mobile (hidden md:block) === */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fiscal / Contato</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Endereço</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                        <span className="block font-bold text-gray-900">{cliente.nome}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                            cliente.tipo === 'restaurante' ? 'bg-purple-100 text-purple-700' :
                            cliente.tipo === 'emporio' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>{cliente.tipo}</span>
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
                    <td className="p-4 text-right">
                      <button 
                          onClick={() => abrirEditar(cliente)} 
                          className="text-blue-600 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                          Editar ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* === VERSÃO MOBILE (CARDS) - Escondida no Desktop (md:hidden) === */}
      <div className="md:hidden space-y-4">
        {clientes.map((cliente) => (
            <div key={cliente.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{cliente.nome}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                            cliente.tipo === 'restaurante' ? 'bg-purple-100 text-purple-700' :
                            cliente.tipo === 'emporio' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>{cliente.tipo}</span>
                    </div>
                    <button 
                        onClick={() => abrirEditar(cliente)} 
                        className="bg-gray-100 text-gray-600 p-2 rounded-lg text-sm font-bold"
                    >
                        ✏️
                    </button>
                </div>
                
                <div className="space-y-1 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📞</span> <span className="font-mono">{cliente.telefone || 'Sem telefone'}</span>
                    </div>
                    {cliente.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                            <span>📧</span> <span className="truncate">{cliente.email}</span>
                        </div>
                    )}
                    {cliente.endereco && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <span>📍</span> 
                            <span>
                                {cliente.endereco}, {cliente.numero} <br/>
                                <span className="text-xs text-gray-400">{cliente.bairro}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>

      {clientes.length === 0 && <div className="p-8 text-center text-gray-400">Nenhum cliente cadastrado.</div>}

      {/* === MODAL UNIFICADO (CRIAR/EDITAR) === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Ajustado max-h e overflow para mobile */}
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh] md:max-h-auto">
                
                {/* Cabeçalho Fixo do Modal */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900">{modoEdicao ? 'Editar Cliente' : 'Novo Cliente'} 👤</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black font-bold p-2 text-xl cursor-pointer">✕</button>
                </div>
                
                {/* Corpo do Modal com Scroll */}
                <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    
                    {/* SEÇÃO 1: DADOS BÁSICOS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados Principais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo *</label>
                                <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900" placeholder="Ex: Fulano da Silva" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp *</label>
                                <input required value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900" placeholder="(00) 00000-0000" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Tipo *</label>
                                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-black text-gray-900 cursor-pointer">
                                    <option value="consumidor">Pessoa Física</option>
                                    <option value="emporio">Empório / Revenda</option>
                                    <option value="restaurante">Restaurante</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: FISCAL */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados Fiscais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">CPF / CNPJ</label>
                                <input value={cpfCnpj} onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black font-mono text-gray-900" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">E-mail (Para NFe)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="cliente@email.com" />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 3: ENDEREÇO */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">CEP</label>
                                <input value={cep} onChange={e => { setCep(maskCep(e.target.value)); if(e.target.value.length >= 8) buscarCep(e.target.value) }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="00000-000" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Endereço (Rua)</label>
                                <input value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                                <input id="inputNumero" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Complemento</label>
                                <input value={complemento} onChange={e => setComplemento(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" placeholder="Apto, Sala..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                                <input value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                                <input value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">UF</label>
                                <input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black uppercase text-gray-900" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Salvando...' : (modoEdicao ? 'Atualizar Cliente' : 'Cadastrar Cliente')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  )
}