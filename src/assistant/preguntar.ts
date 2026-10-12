/**
 * Orquesta una pregunta al asistente: usa la conexión ACTIVA y, si es un flujo y falla, pasa SOLA a la
 * cuenta de API de respaldo (si hay una elegida), avisando de qué ha pasado.
 */
import { preguntarApi, preguntarFlujo } from './providers'
import type { Conexion, Mensaje } from './types'

export interface Respuesta {
  texto: string
  /** Aviso para la persona cuando se ha usado el respaldo. */
  aviso?: string
}

type Fetch = typeof fetch

async function con(c: Conexion, sistema: string, mensajes: Mensaje[], sessionId: string, f: Fetch): Promise<string> {
  return c.tipo === 'api' ? preguntarApi(c, sistema, mensajes, f) : preguntarFlujo(c, sistema, mensajes, sessionId, false, f)
}

export async function preguntar(
  activa: Conexion,
  respaldo: Conexion | null,
  sistema: string,
  mensajes: Mensaje[],
  sessionId: string,
  f: Fetch = fetch,
): Promise<Respuesta> {
  try {
    return { texto: await con(activa, sistema, mensajes, sessionId, f) }
  } catch (e) {
    const motivo = e instanceof Error ? e.message : 'error desconocido'
    // El respaldo solo entra cuando falla un FLUJO y hay una cuenta de API distinta elegida.
    if (activa.tipo !== 'flujo' || !respaldo || respaldo.tipo !== 'api' || respaldo.id === activa.id) throw e
    try {
      const texto = await con(respaldo, sistema, mensajes, sessionId, f)
      return { texto, aviso: `${motivo.replace(/[.\s]*$/, '')}. Ha respondido la cuenta de respaldo «${respaldo.nombre}».` }
    } catch (e2) {
      throw new Error(`${motivo.replace(/[.\s]*$/, '')}. Y la cuenta de respaldo «${respaldo.nombre}» también falló: ${e2 instanceof Error ? e2.message : 'error desconocido'}`)
    }
  }
}
