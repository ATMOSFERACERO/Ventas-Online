import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Conexion } from './types'

interface Estado {
  conexiones: Conexion[]
  activaId: string | null
  respaldoId: string | null
}

interface AssistantStore extends Estado {
  activa: Conexion | null
  respaldo: Conexion | null
  /** Hay una conexión activa: si no, el botón del asistente se bloquea. */
  disponible: boolean
  guardar: (c: Conexion) => void
  borrar: (id: string) => void
  activar: (id: string) => void
  elegirRespaldo: (id: string | null) => void
}

const CLAVE = 'asistente-conexiones'
const Ctx = createContext<AssistantStore | null>(null)

function leer(): Estado {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Estado>
      return { conexiones: Array.isArray(p.conexiones) ? p.conexiones : [], activaId: p.activaId ?? null, respaldoId: p.respaldoId ?? null }
    }
  } catch {
    /* almacenamiento no disponible o dañado: se empieza sin conexiones */
  }
  return { conexiones: [], activaId: null, respaldoId: null }
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(leer)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado))
    } catch {
      /* sin almacenamiento: se pierde al cerrar */
    }
  }, [estado])

  const value = useMemo<AssistantStore>(() => {
    const activa = estado.conexiones.find((c) => c.id === estado.activaId) ?? null
    const respaldo = estado.conexiones.find((c) => c.id === estado.respaldoId) ?? null
    return {
      ...estado,
      activa,
      respaldo,
      disponible: activa !== null,
      // Una conexión nueva queda activa si aún no hay ninguna (como en Fluxy: se da de alta y se usa).
      guardar: (c) =>
        setEstado((s) => {
          const existe = s.conexiones.some((x) => x.id === c.id)
          return { ...s, conexiones: existe ? s.conexiones.map((x) => (x.id === c.id ? c : x)) : [...s.conexiones, c], activaId: s.activaId ?? c.id }
        }),
      // Se puede borrar CUALQUIERA, también la activa: no hay dependencias; sin activa el asistente queda bloqueado.
      borrar: (id) =>
        setEstado((s) => ({
          conexiones: s.conexiones.filter((x) => x.id !== id),
          activaId: s.activaId === id ? null : s.activaId,
          respaldoId: s.respaldoId === id ? null : s.respaldoId,
        })),
      activar: (id) => setEstado((s) => ({ ...s, activaId: id, respaldoId: s.respaldoId === id ? null : s.respaldoId })),
      elegirRespaldo: (id) => setEstado((s) => ({ ...s, respaldoId: id })),
    }
  }, [estado])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAssistant() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useAssistant fuera de AssistantProvider')
  return s
}
