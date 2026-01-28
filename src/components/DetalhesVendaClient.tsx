"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ModalAlerta } from './ModalAlerta'
import { ModalConfirmacao } from './ModalConfirmacao'
import type { AlertType } from '@/types'

interface Props {
  venda: any
}

export function DetalhesVendaClient({ venda }: Props) {
  const router = useRouter()
  const [alerta, setAlerta] = useState<{ isOpen: boolean; title: string; message: string; type: AlertType }>({ isOpen: false, title: '', message: '', type: 'error' })
  const [modalExcluir, setModalExcluir] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const excluirVenda = async () => {
    setCarregando(true)
    try {
      const { data, error } = await supabase.rpc('excluir_venda_com_reversao', { p_venda_id: venda.id })

      if (error) throw error
      if (data && data[0]) {
        const resultado = data[0]
        if (resultado.sucesso) {
          setAlerta({ isOpen: true, title: 'Sucesso', message: resultado.mensagem + ' Redirecionando...', type: 'success' })
          setModalExcluir(false)
          setTimeout(() => {
            router.push('/vendas')
          }, 2000)
        } else {
          setAlerta({ isOpen: true, title: 'Erro', message: resultado.mensagem, type: 'error' })
          setCarregando(false)
        }
      }
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error)
      setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao excluir venda: ' + (error.message || 'Desconhecido'), type: 'error' })
      setCarregando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setModalExcluir(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase border bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
        title="Excluir venda (reverter estoque)"
      >
        🗑️ Excluir Venda
      </button>

      <ModalAlerta
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        type={alerta.type}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />

      <ModalConfirmacao
        isOpen={modalExcluir}
        title="Excluir Venda?"
        message="Tem certeza que deseja excluir esta venda? Todos os produtos serão devolvidos ao estoque e o histórico será registrado em log."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={excluirVenda}
        onCancel={() => setModalExcluir(false)}
        isDangerous={true}
        loading={carregando}
      />
    </>
  )
}
