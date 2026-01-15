"use client"
import { useState } from 'react'

export function ComprasList({ compras }: { compras: any[] }) {
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)) // Ex: "2024-02"

  // Filtra pelo mês selecionado
  const comprasFiltradas = compras.filter(c => 
    c.data_movimento.startsWith(filtroMes)
  )

  // Cálculos
  const totalGasto = comprasFiltradas.reduce((acc, c) => acc + (c.valor_total || 0), 0)
  const qtdCompras = comprasFiltradas.length

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
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-xl group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                        🛒
                    </div>
                    <div>
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

            {/* SEÇÃO DE OBSERVAÇÃO (Só aparece se existir texto) */}
            {item.observacao && (
                <div className="mt-4 pt-3 border-t border-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Observação:</p>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                        "{item.observacao}"
                    </p>
                </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}