"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ModalAlerta } from './ModalAlerta'
import { ModalConfirmacao } from './ModalConfirmacao'
import type { AlertType } from '@/types'

export function ComprasList({ compras }: { compras: any[] }) {
  const router = useRouter()
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)) // Ex: "2024-02"
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  const [confirmacao, setConfirmacao] = useState({ isOpen: false, title: '', message: '', compraParaExcluir: null as any })
  
  // Estados do modal de edição
  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [compraEditando, setCompraEditando] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Estados do formulário de edição
  const [qtdEdit, setQtdEdit] = useState('')
  const [valorEdit, setValorEdit] = useState('')
  const [codigoEdit, setCodigoEdit] = useState('')
  const [fornecedorEdit, setFornecedorEdit] = useState('')
  const [obsEdit, setObsEdit] = useState('')

  // Filtra pelo mês selecionado
  const comprasFiltradas = compras.filter(c => 
    c.data_movimento.startsWith(filtroMes)
  )

  // Cálculos
  const totalGasto = comprasFiltradas.reduce((acc, c) => acc + (c.valor_total || 0), 0)
  const qtdCompras = comprasFiltradas.length

  // Abrir modal de edição
  const abrirEdicao = (compra: any) => {
    setCompraEditando(compra)
    setQtdEdit(compra.quantidade.toString())
    setValorEdit(compra.valor_total.toString())
    setCodigoEdit(compra.codigo_compra || '')
    setFornecedorEdit(compra.fornecedor || '')
    setObsEdit(compra.observacao || '')
    setModalEditOpen(true)
  }

  // Fechar modal
  const fecharModal = () => {
    setModalEditOpen(false)
    setCompraEditando(null)
    setQtdEdit('')
    setValorEdit('')
    setCodigoEdit('')
    setFornecedorEdit('')
    setObsEdit('')
  }

  // Editar compra
  const handleEditarCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compraEditando) return

    const qtdAntiga = compraEditando.quantidade
    const qtdNova = Number(qtdEdit)
    const valorAntigo = compraEditando.valor_total
    const valorNovo = Number(valorEdit)

    if (qtdNova <= 0 || valorNovo <= 0) {
      setAlerta({ isOpen: true, title: 'Erro', message: 'Quantidade e valor devem ser maiores que zero.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      // 1. Buscar estoque atual do insumo
      const { data: insumo } = await supabase
        .from('Insumo')
        .select('quantidade_atual')
        .eq('id', compraEditando.insumo_id)
        .single()

      if (!insumo) throw new Error("Insumo não encontrado")

      // 2. Reverter quantidade antiga
      const estoqueAposReversao = insumo.quantidade_atual - qtdAntiga

      // 3. Aplicar nova quantidade
      const novoEstoque = estoqueAposReversao + qtdNova

      // 4. Atualizar estoque do insumo
      await supabase
        .from('Insumo')
        .update({ quantidade_atual: novoEstoque })
        .eq('id', compraEditando.insumo_id)

      // 5. Atualizar registro de movimentação
      await supabase
        .from('MovimentacaoInsumo')
        .update({
          quantidade: qtdNova,
          valor_total: valorNovo,
          codigo_compra: codigoEdit || null,
          fornecedor: fornecedorEdit || null,
          observacao: obsEdit || null
        })
        .eq('id', compraEditando.id)

      // 6. Log da edição
      await supabase.from('Logs').insert({
        categoria: 'ESTOQUE',
        acao: 'COMPRA_EDITADA',
        descricao: `Compra editada: ${compraEditando.Insumo?.nome || 'N/A'} - Qtd: ${qtdAntiga} → ${qtdNova}${compraEditando.Insumo?.unidade || ''} - Valor: R$ ${valorAntigo.toFixed(2)} → R$ ${valorNovo.toFixed(2)}`
      })

      setAlerta({ isOpen: true, title: 'Sucesso', message: 'Compra editada com sucesso!', type: 'success' })
      router.refresh()
      fecharModal()
    } catch (err: any) {
      await supabase.from('Logs').insert({
        categoria: 'ERRO',
        acao: 'ERRO_EDITAR_COMPRA',
        descricao: `Erro ao editar compra ${compraEditando?.id}: ${err.message}`
      })
      setAlerta({ isOpen: true, title: 'Erro', message: `Erro ao editar compra: ${err.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Excluir compra
  const handleExcluirCompra = async (compra: any) => {
    setConfirmacao({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Deseja EXCLUIR esta compra?\n\n${compra.Insumo?.nome || 'Item'}: ${compra.quantidade} ${compra.Insumo?.unidade || ''}\nValor: R$ ${compra.valor_total.toFixed(2)}\n\nO estoque será revertido automaticamente.`,
      compraParaExcluir: compra
    })
  }

  const confirmarExclusao = async () => {
    if (!confirmacao.compraParaExcluir) return

    const compra = confirmacao.compraParaExcluir
    setConfirmacao({ isOpen: false, title: '', message: '', compraParaExcluir: null })
    setLoading(true)
    try {
      // 1. Buscar estoque atual do insumo
      const { data: insumo } = await supabase
        .from('Insumo')
        .select('quantidade_atual')
        .eq('id', compra.insumo_id)
        .single()

      if (!insumo) throw new Error("Insumo não encontrado")

      // 2. Reverter quantidade do estoque
      const novoEstoque = insumo.quantidade_atual - compra.quantidade

      // 3. Atualizar estoque
      await supabase
        .from('Insumo')
        .update({ quantidade_atual: novoEstoque })
        .eq('id', compra.insumo_id)

      // 4. Deletar registro de movimentação
      await supabase
        .from('MovimentacaoInsumo')
        .delete()
        .eq('id', compra.id)

      // 5. Log da exclusão
      await supabase.from('Logs').insert({
        categoria: 'ESTOQUE',
        acao: 'COMPRA_EXCLUIDA',
        descricao: `Compra excluída: ${compra.Insumo?.nome || 'N/A'} - Qtd revertida: ${compra.quantidade}${compra.Insumo?.unidade || ''} - Valor: R$ ${compra.valor_total.toFixed(2)}`
      })

      setAlerta({ isOpen: true, title: 'Sucesso', message: 'Compra excluída com sucesso! Estoque revertido.', type: 'success' })
      router.refresh()
    } catch (err: any) {
      await supabase.from('Logs').insert({
        categoria: 'ERRO',
        acao: 'ERRO_EXCLUIR_COMPRA',
        descricao: `Erro ao excluir compra ${compra.id}: ${err.message}`
      })
      setAlerta({ isOpen: true, title: 'Erro', message: `Erro ao excluir compra: ${err.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO COM TOTAIS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Filtrar por Mês</label>
            <input 
                type="month" 
                value={filtroMes} 
                onChange={e => setFiltroMes(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-gray-900 outline-none focus:border-black "
            />
        </div>
        <div className="text-right">
            <span className="block text-xs font-bold text-red-400 uppercase">Total Gasto ({filtroMes})</span>
            <span className="text-3xl font-black text-red-600">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="block text-xs text-gray-400 font-bold mt-1">{qtdCompras} lançamentos</span>
        </div>
      </div>

      {/* LISTA DE COMPRAS */}
      <div className="space-y-3">
        {comprasFiltradas.length === 0 && (
            <p className="text-center text-gray-400 py-8">Nenhuma compra registrada neste mês.</p>
        )}

        {comprasFiltradas.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-red-200 transition-all group">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Lado Esquerdo: Ícone + Infos */}
                <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-xl group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                        🛒
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{item.Insumo?.nome || 'Item excluído'}</h3>
                        
                        {/* Badges de Data e Fornecedor */}
                        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase mt-1">
                            <span className="text-gray-400 flex items-center gap-1">
                                {new Date(item.data_movimento).toLocaleDateString('pt-BR')}
                            </span>
                            {item.fornecedor && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                    {item.fornecedor}
                                </span>
                            )}
                            {item.codigo_compra && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono border border-gray-200">
                                    #{item.codigo_compra}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Valores */}
                <div className="text-right w-full md:w-auto border-t md:border-0 border-gray-50 pt-3 md:pt-0 flex justify-between md:block">
                    <div className="md:hidden text-xs font-bold text-gray-400 uppercase pt-2">Total</div>
                    <div>
                        <span className="block text-xl font-black text-gray-900">R$ {item.valor_total?.toFixed(2)}</span>
                        <span className="text-xs font-bold text-gray-500">
                            {item.quantidade} {item.Insumo?.unidade}
                        </span>
                    </div>
                </div>
            </div>

            {/* Barra de ações e observação */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              {/* Observação (se existir) */}
              {item.observacao && (
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Observação:</p>
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                    "{item.observacao}"
                  </p>
                </div>
              )}
              
              {/* Botões de ação */}
              <div className={`flex gap-2 ${item.observacao ? '' : 'ml-auto'}`}>
                <button
                  onClick={() => abrirEdicao(item)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-bold text-sm flex items-center gap-2"
                  title="Editar compra"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
                <button
                  onClick={() => handleExcluirCompra(item)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 font-bold text-sm flex items-center gap-2"
                  title="Excluir compra"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Excluir
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal de Edição */}
      {modalEditOpen && compraEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Editar Compra</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-black font-bold p-2 text-xl">✕</button>
            </div>

            <form onSubmit={handleEditarCompra} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Insumo</span>
                <span className="text-lg font-bold text-gray-900">{compraEditando.Insumo?.nome || 'Item excluído'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qtd ({compraEditando.Insumo?.unidade || ''})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qtdEdit}
                    onChange={e => setQtdEdit(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 font-bold placeholder-gray-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorEdit}
                    onChange={e => setValorEdit(e.target.value)}
                    className="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none focus:border-green-500 text-green-900 font-bold placeholder-green-700/50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nº Nota / Pedido</label>
                  <input
                    value={codigoEdit}
                    onChange={e => setCodigoEdit(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 placeholder-gray-500"
                    placeholder="NF 123"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Fornecedor</label>
                  <input
                    value={fornecedorEdit}
                    onChange={e => setFornecedorEdit(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 placeholder-gray-500"
                    placeholder="Vidros Sul"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Observação</label>
                <input
                  value={obsEdit}
                  onChange={e => setObsEdit(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black text-gray-900 placeholder-gray-500"
                  placeholder="Ex: Marca Y"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
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

      <ModalConfirmacao
        isOpen={confirmacao.isOpen}
        title={confirmacao.title}
        message={confirmacao.message}
        isDangerous={true}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmacao({ isOpen: false, title: '', message: '', compraParaExcluir: null })}
        loading={loading}
      />
    </div>
  )
}
