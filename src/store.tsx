import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ANUNCIOS_INICIALES } from './data'
import type { Anuncio } from './types'

interface Store {
  anuncios: Anuncio[]
  favoritos: string[]
  añadir: (a: Omit<Anuncio, 'id' | 'fecha'>) => string
  alternarFavorito: (id: string) => void
}

const Ctx = createContext<Store | null>(null)

function leer<T>(clave: string, defecto: T): T {
  try {
    const raw = localStorage.getItem(clave)
    return raw ? (JSON.parse(raw) as T) : defecto
  } catch {
    return defecto
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* almacenamiento no disponible */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>(() => leer('anuncios', ANUNCIOS_INICIALES))
  const [favoritos, setFavoritos] = useState<string[]>(() => leer('favoritos', []))

  useEffect(() => guardar('anuncios', anuncios), [anuncios])
  useEffect(() => guardar('favoritos', favoritos), [favoritos])

  const añadir: Store['añadir'] = (a) => {
    const id = crypto.randomUUID()
    setAnuncios((prev) => [{ ...a, id, fecha: new Date().toISOString().slice(0, 10) }, ...prev])
    return id
  }
  const alternarFavorito = (id: string) =>
    setFavoritos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return <Ctx.Provider value={{ anuncios, favoritos, añadir, alternarFavorito }}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}
