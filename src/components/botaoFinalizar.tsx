"use client"
import { supabase } from '@/lib/supabase' // Use o client-side
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  loteId: string
  tipo: string
  qtd750: number
  qtd375: number
}

export function BotaoFinalizar({ loteId, tipo, qtd750, qtd375 }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleFinalizar = async () => {
    const confirmacao = window.confirm(
      `Confirmar finalização do Lote ${loteId}?\n\n` + 
      `Isso irá adicionar:\n` +
      `+ ${qtd750} garrafas de 750ml\n` +
      `+ ${qtd375} garrafas de 375ml\n` +
      `ao seu estoque disponível.`
    )

    if (!confirmacao) return

    setLoading(true)

    try {
      // 1. Atualizar Estoque 750ml
      if (qtd750 > 0) {
        await supabase.rpc('incrementar_estoque', { 
          p_tipo: tipo, 
          p_tamanho: 750, 
          p_qtd: qtd750 
        })
      }

      // 2. Atualizar Estoque 375ml
      if (qtd375 > 0) {
        await supabase.rpc('incrementar_estoque', { 
          p_tipo: tipo, 
          p_tamanho: 375, 
          p_qtd: qtd375 
        })
      }

      // 3. Marcar lote como finalizado
      const { error } = await supabase
        .from('Lote')
        .update({ status: 'finalizado' })
        .eq('id', loteId)

      if (error) throw error

      alert('Lote finalizado e estoque atualizado!')
      router.refresh() // Atualiza a tela

    } catch (error: any) {
      alert('Erro ao finalizar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleFinalizar}
      disabled={loading}
      className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-lg shadow-green-100 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
    >
      {loading ? 'Processando...' : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Finalizar Lote
        </>
      )}
    </button>
  )
}