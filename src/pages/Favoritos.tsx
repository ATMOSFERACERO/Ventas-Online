import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../store'

export default function Favoritos() {
  const { anuncios, favoritos } = useStore()
  const lista = anuncios.filter((a) => favoritos.includes(a.id))
  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold">Mis favoritos</h1>
      {lista.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Aún no has guardado nada. <Link to="/" className="text-brand">Explorar artículos</Link></p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{lista.map((a) => <ProductCard key={a.id} a={a} />)}</div>
      )}
    </>
  )
}
