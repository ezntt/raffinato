"use client"

interface ModalAlertaProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  closeText?: string
}

/**
 * Modal de Alerta Padrão
 * Substitui window.alert() com melhor UX
 * 
 * @example
 * const [alertModal, setAlertModal] = useState({
 *   isOpen: false,
 *   title: '',
 *   message: '',
 *   type: 'info',
 * })
 * 
 * <ModalAlerta
 *   isOpen={alertModal.isOpen}
 *   title={alertModal.title}
 *   message={alertModal.message}
 *   type={alertModal.type}
 *   onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
 * />
 */
export function ModalAlerta({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
  closeText = 'OK',
}: ModalAlertaProps) {
  if (!isOpen) return null

  // Define cores baseado no tipo
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      button: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const config = colors[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className={`p-6 border-b ${config.border} ${config.bg}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <h2 className="text-xl font-black text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`w-full px-4 py-3 rounded-lg text-white font-bold transition-all ${config.button}`}
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  )
}
