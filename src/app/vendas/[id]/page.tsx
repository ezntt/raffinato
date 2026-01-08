import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalhesVendaPage(props: Props) {
  const params = await props.params
  const { id } = params
  
  const supabase = await createClient()

  const { data: venda } = await supabase
    .from('vendas')
    .select(`
      *,
      Cliente ( * ),
      itens_venda ( * )
    `)
    .eq('id', id)
    .single()

  if (!venda) return notFound()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto mt-12 md:mt-0">
      
      <Link href="/vendas" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-bold mb-6 transition-colors">
        ← Voltar para lista
      </Link>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* CABEÇALHO */}
        <div className="bg-gray-50 p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Venda #{venda.id}</span>
              {venda.pago ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200">PAGO</span>
              ) : (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200">PENDENTE</span>
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 mt-2">R$ {venda.valor_total.toFixed(2)}</h1>
            <p className="text-gray-400 font-medium text-sm mt-1">
              {new Date(venda.data_venda).toLocaleDateString('pt-BR')} às {new Date(venda.data_venda).toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div className="text-left md:text-right bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Cliente</span>
            <h2 className="text-lg font-black text-gray-900">{venda.Cliente?.nome || 'Não informado'}</h2>
            <p className="text-gray-500 text-sm font-medium">{venda.Cliente?.telefone || '-'}</p>
            <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              {venda.Cliente?.tipo || 'consumidor'}
            </span>
          </div>
        </div>

        {/* ITENS */}
        <div className="p-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Itens Adquiridos</h3>
          <div className="space-y-4">
            {venda.itens_venda?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${item.produto === 'limoncello' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {item.produto === 'limoncello' ? '🍋' : '🍊'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 capitalize text-lg">
                        {item.produto} 
                        </p>
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">{item.tamanho}ml</span>
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                        {/* AQUI MOSTRAMOS O LOTE */}
                        {item.lote_id ? (
                             <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                Lote: {item.lote_id}
                             </span>
                        ) : (
                             <span className="text-[10px] font-bold uppercase bg-gray-50 text-gray-400 px-2 py-0.5 rounded">
                                Estoque Antigo
                             </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-black text-gray-900 text-xl">{item.quantidade}x</span>
                  <span className="block text-sm font-bold text-gray-400 mt-1">
                    Total: <span className="text-gray-800">R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="bg-yellow-50 p-8 border-t border-yellow-100">
          <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-2">Observações</h3>
          <p className="text-gray-800 font-medium italic bg-yellow-100/50 p-4 rounded-xl border border-yellow-200/50">
            {venda.observacao || "Nenhuma observação registrada."}
          </p>
        </div>

      </div>
    </div>
  )
}