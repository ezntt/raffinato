import { createClient } from '@/lib/supabaseServer'
import { VendasList } from '@/components/VendasList'

export const revalidate = 0

export default async function VendasPage() {
  const supabase = await createClient()

  // Atenção aqui: 'Cliente' com C maiúsculo
  const { data: vendas } = await supabase
    .from('vendas')
    .select(`
      id, data_venda, valor_total, pago,
      Cliente ( nome, tipo ) 
    `)
    .order('data_venda', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-12 md:mt-0">
      <VendasList initialVendas={vendas || []} />
    </div>
  )
}