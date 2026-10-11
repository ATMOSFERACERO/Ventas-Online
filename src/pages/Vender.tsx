import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { CATEGORIAS, EMOJI_CATEGORIA, ESTADOS, type Categoria, type Estado } from '../types'

export default function Vender() {
  const { añadir } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ titulo: '', descripcion: '', precio: '', categoria: CATEGORIAS[0] as Categoria, estado: ESTADOS[1] as Estado, vendedor: '', ciudad: '' })
  const [error, setError] = useState('')

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const precio = Number(f.precio)
    if (!f.titulo.trim() || !f.vendedor.trim() || !f.ciudad.trim()) return setError('Rellena título, tu nombre y ciudad.')
    if (!Number.isFinite(precio) || precio < 0) return setError('El precio debe ser un número válido.')
    const id = añadir({
      titulo: f.titulo.trim(),
      descripcion: f.descripcion.trim(),
      precio,
      categoria: f.categoria,
      estado: f.estado,
      vendedor: f.vendedor.trim(),
      ciudad: f.ciudad.trim(),
      emoji: EMOJI_CATEGORIA[f.categoria],
    })
    nav(`/anuncio/${id}`)
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold">Publicar un artículo</h1>
      <div><label className="label" htmlFor="t">Título</label><input id="t" className="input" maxLength={80} value={f.titulo} onChange={set('titulo')} /></div>
      <div><label className="label" htmlFor="d">Descripción</label><textarea id="d" className="input" rows={4} maxLength={500} value={f.descripcion} onChange={set('descripcion')} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="p">Precio (€)</label><input id="p" className="input" type="number" min={0} step="0.01" value={f.precio} onChange={set('precio')} /></div>
        <div><label className="label" htmlFor="c">Categoría</label><select id="c" className="input" value={f.categoria} onChange={set('categoria')}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label" htmlFor="e">Estado</label><select id="e" className="input" value={f.estado} onChange={set('estado')}>{ESTADOS.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="v">Tu nombre</label><input id="v" className="input" value={f.vendedor} onChange={set('vendedor')} /></div>
        <div><label className="label" htmlFor="ci">Ciudad</label><input id="ci" className="input" value={f.ciudad} onChange={set('ciudad')} /></div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button className="btn w-full" type="submit">Publicar</button>
    </form>
  )
}
