import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

export const revalidate = 0

export default async function VendasPage() {
  const supabase = await createClient()

  const { data: vendas } = await supabase
    .from('vendas')
    .select(`
      id, data_venda, valor_total,
      Cliente ( nome, tipo )
    `)
    .order('data_venda', { ascending: false })

  // Soma total
  const faturamentoTotal = vendas?.reduce((acc, venda) => acc + venda.valor_total, 0) || 0

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-12 md:mt-0">
      
      <header className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Histórico de Vendas 📜</h1>
          <p className="text-gray-500 font-medium">Clique em uma venda para ver os detalhes completos.</p>
        </div>
        <div className="bg-green-50 px-6 py-4 rounded-2xl border border-green-100 text-right">
          <span className="text-xs uppercase font-bold text-green-600 block">Faturamento Total</span>
          <span className="text-3xl font-black text-green-900">R$ {faturamentoTotal.toFixed(2)}</span>
        </div>
      </header>

      <div className="space-y-3">
        {vendas?.map((venda: any) => (
          <Link 
            href={`/vendas/${venda.id}`} // O segredo: Link para a página de detalhes
            key={venda.id} 
            className="block bg-white p-6 rounded-2xl border border-gray-100 hover:border-black hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                  #{venda.id}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{venda.Cliente?.nome || 'Cliente Desconhecido'}</h2>
                  <p className="text-xs text-gray-400 font-medium uppercase">
                    {new Date(venda.data_venda).toLocaleDateString('pt-BR')} • {new Date(venda.data_venda).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className="block text-xl font-black text-gray-900">R$ {venda.valor_total.toFixed(2)}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Ver Detalhes →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}