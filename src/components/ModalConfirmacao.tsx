"use client"

interface ModalConfirmacaoProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  isDangerous?: boolean
}

/**
 * Modal de Confirmação Padrão
 * Substitui window.confirm() com melhor UX
 * 
 * @example
 * const [confirmModal, setConfirmModal] = useState({
 *   isOpen: false,
 *   title: '',
 *   message: '',
 *   onConfirm: () => {},
 * })
 * 
 * <ModalConfirmacao
 *   isOpen={confirmModal.isOpen}
 *   title={confirmModal.title}
 *   message={confirmModal.message}
 *   onConfirm={confirmModal.onConfirm}
 *   onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
 *   loading={loading}
 * />
 */
export function ModalConfirmacao({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  isDangerous = false,
}: ModalConfirmacaoProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer - Botões */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                : 'bg-black hover:bg-gray-800 disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {loading && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
