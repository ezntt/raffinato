import { createClient } from '@/lib/supabaseServer'
import { ClientesList } from '@/components/ClientesList' // Importando seu novo componente

export const revalidate = 0

export default async function ClientesPage() {
  const supabase = await createClient()

  // 1. Busca os clientes no Banco (Server-Side)
  // Lembre-se: Nome da tabela é 'Cliente' (Singular e Maiúsculo conforme seu padrão)
  const { data: clientes } = await supabase
    .from('Cliente')
    .select('*')
    .order('nome')

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-12 md:mt-0">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Carteira de Clientes 👥</h1>
        <p className="text-gray-500 font-medium">Gerencie seus contatos e parceiros.</p>
      </header>

      {/* 2. Passa os dados para o componente interativo */}
      <ClientesList initialClientes={clientes || []} />
    </div>
  )
}