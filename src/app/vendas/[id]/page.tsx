import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

// CORREÇÃO 1: Definir params como uma Promise
interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalhesVendaPage(props: Props) {
  // CORREÇÃO 2: Desembrulhar a promessa com await
  const params = await props.params
  const { id } = params
  
  const supabase = await createClient()

  // CORREÇÃO 3: Troquei 'Cliente' por 'clientes' (minúsculo) para bater com o SQL
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
      
      {/* Navegação */}
      <Link href="/vendas" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-bold mb-6 transition-colors">
        ← Voltar para lista
      </Link>

      {/* Cartão Principal */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho */}
        <div className="bg-gray-50 p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Venda #{venda.id}</span>
              <span className="text-gray-400 font-medium text-sm">
                {new Date(venda.data_venda).toLocaleDateString('pt-BR')} às {new Date(venda.data_venda).toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900">R$ {venda.valor_total.toFixed(2)}</h1>
          </div>

          <div className="text-left md:text-right">
            {/* CORREÇÃO 4: Acessando 'clientes' minúsculo */}
            <h2 className="text-lg font-bold text-gray-900">{venda.clientes?.nome}</h2>
            <p className="text-gray-500 text-sm">{venda.clientes?.telefone}</p>
            <span className="text-xs font-bold uppercase text-gray-400 bg-gray-200 px-2 py-0.5 rounded mt-1 inline-block">
              {venda.clientes?.tipo || 'Consumidor'}
            </span>
          </div>
        </div>

        {/* Itens */}
        <div className="p-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Itens Adquiridos</h3>
          
          <div className="space-y-4">
            {venda.itens_venda?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${item.produto === 'limoncello' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {item.produto === 'limoncello' ? '🍋' : '🍊'}
                  </div>
                  
                  <div>
                    <p className="font-bold text-gray-900 capitalize text-lg">
                      {item.produto} <span className="text-gray-400 text-sm font-medium">{item.tamanho}ml</span>
                    </p>
                    <p className="text-xs text-gray-400 font-bold uppercase">
                      Preço Unitário: R$ {item.preco_unitario.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block font-black text-gray-900 text-lg">
                    {item.quantidade}x
                  </span>
                  <span className="block text-sm font-medium text-gray-500">
                    Total: R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Rodapé: Observações */}
        <div className="bg-yellow-50 p-8 border-t border-yellow-100">
          <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">Observações da Venda</h3>
          <p className="text-gray-700 font-medium italic">
            {venda.observacao ? `"${venda.observacao}"` : "Nenhuma observação registrada."}
          </p>
        </div>

      </div>
    </div>
  )
}