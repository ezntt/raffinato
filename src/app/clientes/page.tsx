import { createClient } from '@/lib/supabaseServer'
import { ClientesList } from '@/components/ClientesList'

export const revalidate = 0

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clientes } = await supabase
    .from('Cliente')
    .select('*, vendas(id)') 
    .order('nome')

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-12 md:mt-0">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Carteira de Clientes</h1>
      </header>

      <ClientesList initialClientes={clientes || []} />
    </div>
  )
}