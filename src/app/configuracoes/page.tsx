"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estado do Form
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [razao, setRazao] = useState('')
  const [fantasia, setFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ie, setIe] = useState('')
  const [email, setEmail] = useState('')
  
  // Endereço
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('Florianópolis')
  const [estado, setEstado] = useState('SC')

  // Máscara CNPJ
  const maskCNPJ = (v: string) => {
    return v.replace(/\D/g, "")
            .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
            .substring(0, 18)
  }

  // Carregar dados ao abrir
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('Empresa').select('*').single()
      if (data) {
        setEmpresaId(data.id)
        setRazao(data.razao_social || '')
        setFantasia(data.nome_fantasia || '')
        setCnpj(data.cnpj || '')
        setIe(data.inscricao_estadual || '')
        setEmail(data.email_contato || '')
        setCep(data.cep || '')
        setEndereco(data.endereco || '')
        setNumero(data.numero || '')
        setBairro(data.bairro || '')
        setCidade(data.cidade || '')
        setEstado(data.estado || '')
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Salvar
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
        razao_social: razao, nome_fantasia: fantasia, cnpj, inscricao_estadual: ie, email_contato: email,
        cep, endereco, numero, bairro, cidade, estado
    }

    try {
        if (empresaId) {
            // Atualiza
            const { error } = await supabase.from('Empresa').update(payload).eq('id', empresaId)
            if (error) throw error
        } else {
            // Cria (primeira vez)
            const { error } = await supabase.from('Empresa').insert(payload)
            if (error) throw error
        }
        alert("Dados da empresa salvos com sucesso!")
    } catch (err: any) {
        alert("Erro: " + err.message)
    } finally {
        setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Carregando configurações...</div>

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto mt-12 md:mt-0 mb-20">
      <header className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* DADOS JURÍDICOS */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                🏢 Dados Jurídicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Razão Social</label>
                    <input required value={razao} onChange={e => setRazao(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" placeholder="Raffinato Bebidas LTDA" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome Fantasia</label>
                    <input value={fantasia} onChange={e => setFantasia(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" placeholder="Raffinato" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">CNPJ</label>
                    <input required value={cnpj} onChange={e => setCnpj(maskCNPJ(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black font-mono" placeholder="00.000.000/0001-00" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Inscrição Estadual</label>
                    <input value={ie} onChange={e => setIe(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">E-mail Fiscal</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
            </div>
        </section>

        {/* ENDEREÇO */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                📍 Endereço da Sede
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">CEP</label>
                    <input value={cep} onChange={e => setCep(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Rua / Logradouro</label>
                    <input value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Número</label>
                    <input value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Complemento</label>
                    <input value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>
                
                {/* BAIRRO - Agora ocupa 2 colunas */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bairro</label>
                    <input value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black" />
                </div>

                {/* CIDADE/UF - CORREÇÃO: Agora ocupa 2 colunas (md:col-span-2) */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Cidade / UF</label>
                    <div className="flex gap-2">
                        <input value={cidade} onChange={e => setCidade(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black min-w-0" />
                        <input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="w-20 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black text-center uppercase" />
                    </div>
                </div>
            </div>
        </section>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end">
            <button 
                type="submit" 
                disabled={saving}
                className="bg-green-600 cursor-pointer hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all disabled:opacity-50 w-full md:w-auto text-lg"
            >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
        </div>

      </form>
    </div>
  )
}