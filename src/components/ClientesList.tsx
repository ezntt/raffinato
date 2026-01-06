"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function ClientesList({ initialClientes }: { initialClientes: any[] }) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initialClientes)
  
  // === ESTADOS DE EDIÇÃO ===
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editFone, setEditFone] = useState('')
  const [editTipo, setEditTipo] = useState('')

  // === ESTADOS DE CRIAÇÃO (NOVO CLIENTE) ===
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoFone, setNovoFone] = useState('')
  const [novoTipo, setNovoTipo] = useState('consumidor')
  const [loading, setLoading] = useState(false)

  // === MÁSCARA DE TELEFONE ===
  const formatarTelefone = (valor: string) => {
    let v = valor.replace(/\D/g, "")
    v = v.substring(0, 11)
    if (v.length > 10) v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
    else if (v.length > 5) v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    else if (v.length > 2) v = v.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2")
    else if (v !== "") v = v.replace(/^(\d*)/, "($1")
    return v
  }

  // === AÇÕES DE CRIAÇÃO ===
  const handleCriarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const { data: novo, error } = await supabase
            .from('Cliente')
            .insert({ nome: novoNome, telefone: novoFone, tipo: novoTipo })
            .select()
            .single()

        if (error) throw error

        setClientes([...clientes, novo].sort((a,b) => a.nome.localeCompare(b.nome)))
        setIsModalOpen(false)
        setNovoNome('')
        setNovoFone('')
        alert("Cliente cadastrado com sucesso!")
        router.refresh()

    } catch (err: any) {
        alert("Erro ao criar: " + err.message)
    } finally {
        setLoading(false)
    }
  }

  // === AÇÕES DE EDIÇÃO ===
  const startEdit = (cliente: any) => {
    setEditingId(cliente.id)
    setEditNome(cliente.nome)
    setEditFone(cliente.telefone || '')
    setEditTipo(cliente.tipo || 'consumidor')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    const updatedList = clientes.map(c => 
        c.id === id ? { ...c, nome: editNome, telefone: editFone, tipo: editTipo } : c
    )
    setClientes(updatedList)
    setEditingId(null)

    const { error } = await supabase
        .from('Cliente')
        .update({ nome: editNome, telefone: editFone, tipo: editTipo })
        .eq('id', id)

    if (error) {
        alert("Erro ao salvar cliente: " + error.message)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black cursor-pointer hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
            <span>+ Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* WRAPPER PARA SCROLL HORIZONTAL MOBILE */}
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 md:p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nome</th>
                  <th className="p-3 md:p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contato</th>
                  <th className="p-3 md:p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="p-3 md:p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors group">
                    
                    {/* NOME */}
                    <td className="p-3 md:p-4">
                      {editingId === cliente.id ? (
                          <input 
                              value={editNome} 
                              onChange={e => setEditNome(e.target.value)} 
                              className="w-full min-w-[150px] p-2 border border-blue-300 rounded-lg outline-none text-gray-900 font-bold"
                          />
                      ) : (
                          <span className="font-bold text-gray-900 whitespace-nowrap">{cliente.nome}</span>
                      )}
                    </td>

                    {/* TELEFONE */}
                    <td className="p-3 md:p-4">
                      {editingId === cliente.id ? (
                          <input 
                              value={editFone} 
                              onChange={e => setEditFone(formatarTelefone(e.target.value))} 
                              className="w-full min-w-[150px] p-2 border border-blue-300 rounded-lg outline-none text-gray-900"
                              placeholder="(XX) XXXXX-XXXX"
                          />
                      ) : (
                          <span className="text-gray-500 font-mono text-sm whitespace-nowrap">{cliente.telefone}</span>
                      )}
                    </td>

                    {/* TIPO */}
                    <td className="p-3 md:p-4">
                      {editingId === cliente.id ? (
                          <select 
                              value={editTipo} 
                              onChange={e => setEditTipo(e.target.value)} 
                              className="p-2 border border-blue-300 rounded-lg outline-none text-gray-900 text-sm"
                          >
                              <option value="consumidor">Pessoa</option>
                              <option value="emporio">Empório</option>
                              <option value="restaurante">Restaurante</option>
                          </select>
                      ) : (
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded whitespace-nowrap ${
                            cliente.tipo === 'restaurante' ? 'bg-purple-100 text-purple-700' :
                            cliente.tipo === 'emporio' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                              {cliente.tipo}
                          </span>
                      )}
                    </td>

                    {/* AÇÕES */}
                    <td className="p-3 md:p-4 text-right whitespace-nowrap">
                      {editingId === cliente.id ? (
                          <div className="flex justify-end gap-2">
                              <button onClick={cancelEdit} className="text-gray-400 cursor-pointer hover:text-gray-600 font-bold text-sm">✕</button>
                              <button onClick={() => saveEdit(cliente.id)} className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold text-sm">Salvar</button>
                          </div>
                      ) : (
                          <button 
                              onClick={() => startEdit(cliente)} 
                              className="text-gray-300 cursor-pointer hover:text-blue-600 font-bold text-sm transition-colors"
                          >
                              Editar ✏️
                          </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        {clientes.length === 0 && <div className="p-8 text-center text-gray-400">Nenhum cliente cadastrado.</div>}
      </div>

      {/* === MODAL DE NOVO CLIENTE === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold p-2">✕</button>
                
                <h2 className="text-2xl font-black text-gray-900 mb-6">Novo Cliente 👤</h2>
                
                <form onSubmit={handleCriarCliente} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome</label>
                        <input 
                            required 
                            autoFocus
                            value={novoNome}
                            onChange={e => setNovoNome(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold"
                            placeholder="Ex: Fulano da Silva"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">WhatsApp</label>
                        <input 
                            required 
                            value={novoFone}
                            onChange={e => setNovoFone(formatarTelefone(e.target.value))}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold"
                            placeholder="(48) 99999-9999"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tipo</label>
                        <select 
                            value={novoTipo} 
                            onChange={e => setNovoTipo(e.target.value)} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold"
                        >
                            <option value="consumidor">Pessoa Física</option>
                            <option value="emporio">Empório / Revenda</option>
                            <option value="restaurante">Restaurante</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Salvando...' : 'Cadastrar Cliente'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </>
  )
}