// src/app/custos/page.tsx
import { CalculadoraCustos } from '@/components/CalculadoraCustos'

export default function CustosPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto mb-20">
       <CalculadoraCustos />
    </div>
  )
}