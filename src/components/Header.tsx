import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../store'

export default function Header() {
  const { favoritos } = useStore()
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'text-brand' : 'text-slate-600 hover:text-brand dark:text-slate-300'}`
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-xl font-extrabold text-brand">♻️ Segundamano</Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={link}>Explorar</NavLink>
          <NavLink to="/favoritos" className={link}>Favoritos ({favoritos.length})</NavLink>
          <Link to="/vender" className="btn ml-2 !py-1.5 text-sm">Vender</Link>
        </nav>
      </div>
    </header>
  )
}
