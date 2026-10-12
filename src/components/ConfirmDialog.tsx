import Modal from './Modal'

interface Props {
  titulo: string
  texto: string
  confirmar: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({ titulo, texto, confirmar, onConfirm, onClose }: Props) {
  return (
    <Modal titulo={titulo} onClose={onClose} ancho="max-w-md">
      <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{texto}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        <button className="btn !bg-red-600 btn-sm hover:!bg-red-700" onClick={onConfirm}>{confirmar}</button>
      </div>
    </Modal>
  )
}
