"use client"
import { useState } from 'react'
import { ModalVenda } from './ModalVenda'

export function DashboardActions() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="mt-12 grid grid-cols-2 gap-4">
        <a 
          href="/calculadora" 
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-xl font-bold text-center transition flex items-center justify-center gap-2"
        >
          <span>+ Produzir Novo Lote</span>
        </a>
        
        <button 
          // O SEGREDO ESTÁ AQUI: Mudamos de alert() para setIsModalOpen(true)
          onClick={() => setIsModalOpen(true)} 
          className="bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold text-center transition shadow-lg shadow-gray-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>$ Registrar Venda / Saída</span>
        </button>
      </div>

      <ModalVenda 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
