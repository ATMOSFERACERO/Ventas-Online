import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { useStore } from '../store'
import { CATEGORIAS } from '../types'

type Orden = 'recientes' | 'precio-asc' | 'precio-desc'

export default function Home() {
  const { anuncios } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [max, setMax] = useState('')
  const [orden, setOrden] = useState<Orden>('recientes')

  const lista = useMemo(() => {
    const tope = max === '' ? Infinity : Number(max)
    const res = anuncios.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q.trim().toLowerCase()) &&
        (cat === '' || a.categoria === cat) &&
        a.precio <= tope,
    )
    if (orden === 'precio-asc') res.sort((a, b) => a.precio - b.precio)
    else if (orden === 'precio-desc') res.sort((a, b) => b.precio - a.precio)
    else res.sort((a, b) => b.fecha.localeCompare(a.fecha))
    return res
  }, [anuncios, q, cat, max, orden])

  return (
    <>
      <section className="mb-6 rounded-2xl bg-brand p-6 text-white">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Dale una segunda vida a lo que ya no usas</h1>
        <p className="mt-1 text-teal-50">Compra y vende artículos de segunda mano, de forma sencilla.</p>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <input className="input sm:col-span-2" placeholder="Buscar artículos…" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Categoría" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
        </select>
        <input className="input" type="number" min={0} placeholder="Precio máx. (€)" aria-label="Precio máximo" value={max} onChange={(e) => setMax(e.target.value)} />
      </div>

      {lista.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No hay artículos que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {lista.map((a) => <ProductCard key={a.id} a={a} />)}
        </div>
      )}
    </>
  )
}
