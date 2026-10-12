import { useEffect, type ReactNode } from 'react'

interface Props {
  titulo: string
  onClose: () => void
  children: ReactNode
  ancho?: string
}

/** Ventana modal accesible: se cierra con Escape o pulsando fuera. */
export default function Modal({ titulo, onClose, children, ancho = 'max-w-lg' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button className="rounded px-2 text-xl leading-none text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
