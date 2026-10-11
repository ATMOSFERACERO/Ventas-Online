import { Link } from 'react-router-dom'
import { useStore } from '../store'
import type { Anuncio } from '../types'

export default function ProductCard({ a }: { a: Anuncio }) {
  const { favoritos, alternarFavorito } = useStore()
  const fav = favoritos.includes(a.id)
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <Link to={`/anuncio/${a.id}`} className="block">
        <div className="flex h-40 items-center justify-center bg-teal-50 text-6xl dark:bg-slate-700">{a.emoji}</div>
        <div className="p-3">
          <p className="text-lg font-bold">{a.precio} €</p>
          <h3 className="truncate text-sm font-medium">{a.titulo}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{a.estado} · {a.ciudad}</p>
        </div>
      </Link>
      <div className="flex justify-end px-3 pb-3">
        <button
          onClick={() => alternarFavorito(a.id)}
          aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={fav}
          className="text-xl"
        >
          {fav ? '❤️' : '🤍'}
        </button>
      </div>
    </article>
  )
}
