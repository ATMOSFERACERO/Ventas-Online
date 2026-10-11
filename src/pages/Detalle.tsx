import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'

export default function Detalle() {
  const { id } = useParams()
  const { anuncios, favoritos, alternarFavorito } = useStore()
  const [contactado, setContactado] = useState(false)
  const a = anuncios.find((x) => x.id === id)

  if (!a) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4">Este anuncio no existe.</p>
        <Link to="/" className="btn">Volver a explorar</Link>
      </div>
    )
  }
  const fav = favoritos.includes(a.id)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex h-72 items-center justify-center rounded-2xl bg-teal-50 text-9xl dark:bg-slate-700">{a.emoji}</div>
      <div>
        <p className="text-3xl font-extrabold">{a.precio} €</p>
        <h1 className="mt-1 text-xl font-semibold">{a.titulo}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.categoria} · {a.estado} · {a.ciudad}</p>
        <p className="mt-4">{a.descripcion}</p>
        <p className="mt-4 text-sm">Vendedor: <strong>{a.vendedor}</strong></p>
        <div className="mt-6 flex gap-3">
          <button className="btn flex-1" onClick={() => setContactado(true)} disabled={contactado}>
            {contactado ? 'Mensaje enviado (simulado)' : 'Contactar con el vendedor'}
          </button>
          <button className="btn-ghost" onClick={() => alternarFavorito(a.id)} aria-pressed={fav}>{fav ? '❤️ Guardado' : '🤍 Guardar'}</button>
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-brand">← Volver</Link>
      </div>
    </div>
  )
}
