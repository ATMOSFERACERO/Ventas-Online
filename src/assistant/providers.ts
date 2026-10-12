/**
 * Llamadas a los modelos de IA (Anthropic, OpenAI, Gemini, compatibles) y a flujos por webhook (n8n,
 * Fluxion8n, Power Automate…). Todo recibe `f` (fetch) para poder probarlo sin red.
 *
 * Contrato con los flujos (ver Manuales/manual-conexion-flujos.html, sección 1.4):
 *   petición  → POST JSON { action: 'sendMessage', sessionId, chatInput, systemPrompt, messages, test }
 *   respuesta → JSON { output: "texto" }   (también se aceptan reply / text / message / response)
 *
 * Seguridad: los mensajes de error NUNCA incluyen la clave ni la URL completa (puede llevar una firma).
 */
import { PROVEEDORES, type ConexionFlujo, type CuentaApi, type Mensaje, type ResultadoPrueba } from './types'

type Fetch = typeof fetch

const quitaBarra = (s: string) => s.replace(/\/+$/, '')

/** Texto corto del error que devuelve un servidor, sin datos sensibles. */
async function detalle(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: { message?: string } | string; message?: string }
    const m = typeof j.error === 'string' ? j.error : (j.error?.message ?? j.message ?? '')
    return m ? ` — ${String(m).slice(0, 160)}` : ''
  } catch {
    return ''
  }
}

function conTiempo(segundos: number): AbortSignal {
  return AbortSignal.timeout(Math.max(1, segundos) * 1000)
}

function errorDeRed(e: unknown, que: string): Error {
  if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) return new Error(`${que} tardó demasiado y se canceló.`)
  if (e instanceof Error && e.message.startsWith(que)) return e
  return new Error(`No se pudo conectar con ${que}. Si usas el navegador, puede ser CORS, una dirección privada o contenido mixto (https → http).`)
}

// ───────────────────────── Cuentas de API ─────────────────────────

export async function preguntarApi(c: CuentaApi, sistema: string, mensajes: Mensaje[], f: Fetch = fetch): Promise<string> {
  const host = quitaBarra(c.host || PROVEEDORES[c.proveedor].host)
  const nombre = PROVEEDORES[c.proveedor].etiqueta
  try {
    if (c.proveedor === 'anthropic') {
      const r = await f(`${host}/v1/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': c.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: c.modelo, max_tokens: 1024, system: sistema, messages: mensajes.map((m) => ({ role: m.rol, content: m.texto })) }),
        signal: conTiempo(90),
      })
      if (!r.ok) throw new Error(`${nombre} respondió ${r.status}${await detalle(r)}`)
      const j = (await r.json()) as { content?: { type: string; text?: string }[] }
      const texto = (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('')
      if (!texto) throw new Error(`${nombre} no devolvió texto.`)
      return texto
    }
    if (c.proveedor === 'gemini') {
      const r = await f(`${host}/v1beta/models/${encodeURIComponent(c.modelo)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': c.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: mensajes.map((m) => ({ role: m.rol === 'assistant' ? 'model' : 'user', parts: [{ text: m.texto }] })),
        }),
        signal: conTiempo(90),
      })
      if (!r.ok) throw new Error(`${nombre} respondió ${r.status}${await detalle(r)}`)
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      const texto = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
      if (!texto) throw new Error(`${nombre} no devolvió texto.`)
      return texto
    }
    // OpenAI y compatibles
    const r = await f(`${host}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(c.apiKey ? { authorization: `Bearer ${c.apiKey}` } : {}) },
      body: JSON.stringify({ model: c.modelo, messages: [{ role: 'system', content: sistema }, ...mensajes.map((m) => ({ role: m.rol, content: m.texto }))] }),
      signal: conTiempo(90),
    })
    if (!r.ok) throw new Error(`${nombre} respondió ${r.status}${await detalle(r)}`)
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] }
    const texto = j.choices?.[0]?.message?.content ?? ''
    if (!texto) throw new Error(`${nombre} no devolvió texto.`)
    return texto
  } catch (e) {
    throw errorDeRed(e, nombre)
  }
}

/** Modelos que ofrece la cuenta (para el desplegable). Si falla, devuelve la lista de ejemplo del proveedor. */
export async function listarModelos(c: CuentaApi, f: Fetch = fetch): Promise<string[]> {
  const host = quitaBarra(c.host || PROVEEDORES[c.proveedor].host)
  try {
    if (c.proveedor === 'anthropic') {
      const r = await f(`${host}/v1/models`, { headers: { 'x-api-key': c.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, signal: conTiempo(15) })
      if (!r.ok) throw new Error(String(r.status))
      return ((await r.json()) as { data?: { id: string }[] }).data?.map((m) => m.id) ?? []
    }
    if (c.proveedor === 'gemini') {
      const r = await f(`${host}/v1beta/models`, { headers: { 'x-goog-api-key': c.apiKey }, signal: conTiempo(15) })
      if (!r.ok) throw new Error(String(r.status))
      return ((await r.json()) as { models?: { name: string }[] }).models?.map((m) => m.name.replace(/^models\//, '')) ?? []
    }
    const r = await f(`${host}/models`, { headers: c.apiKey ? { authorization: `Bearer ${c.apiKey}` } : {}, signal: conTiempo(15) })
    if (!r.ok) throw new Error(String(r.status))
    return ((await r.json()) as { data?: { id: string }[] }).data?.map((m) => m.id) ?? []
  } catch {
    return PROVEEDORES[c.proveedor].modelos
  }
}

export async function probarApi(c: CuentaApi, f: Fetch = fetch): Promise<ResultadoPrueba> {
  const host = quitaBarra(c.host || PROVEEDORES[c.proveedor].host)
  const nombre = PROVEEDORES[c.proveedor].etiqueta
  try {
    const url = c.proveedor === 'anthropic' ? `${host}/v1/models` : c.proveedor === 'gemini' ? `${host}/v1beta/models` : `${host}/models`
    const headers: Record<string, string> =
      c.proveedor === 'anthropic'
        ? { 'x-api-key': c.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
        : c.proveedor === 'gemini'
          ? { 'x-goog-api-key': c.apiKey }
          : c.apiKey
            ? { authorization: `Bearer ${c.apiKey}` }
            : {}
    const r = await f(url, { headers, signal: conTiempo(15) })
    if (!r.ok) return { ok: false, mensaje: `${nombre} respondió ${r.status}${await detalle(r)}` }
    return { ok: true, mensaje: 'Conexión probada correctamente.' }
  } catch (e) {
    return { ok: false, mensaje: errorDeRed(e, nombre).message }
  }
}

// ───────────────────────── Flujos (webhooks) ─────────────────────────

function base64Utf8(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
}

export function cabecerasFlujo(c: ConexionFlujo): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  if (c.auth === 'cabecera' && c.cabeceraNombre.trim()) h[c.cabeceraNombre.trim()] = c.secreto
  else if (c.auth === 'basic') h.authorization = `Basic ${base64Utf8(`${c.usuario}:${c.secreto}`)}`
  else if (c.auth === 'bearer') h.authorization = `Bearer ${c.secreto}`
  return h
}

/** Saca el texto de la respuesta de un flujo: objeto o lista, con `output` (Chat Trigger de n8n) u otros nombres habituales. */
export function extraerTexto(datos: unknown): string {
  const d = Array.isArray(datos) ? datos[0] : datos
  if (typeof d === 'string') return d
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>
    for (const k of ['output', 'reply', 'text', 'message', 'response']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string
    }
  }
  return ''
}

export async function preguntarFlujo(
  c: ConexionFlujo,
  sistema: string,
  mensajes: Mensaje[],
  sessionId: string,
  prueba = false,
  f: Fetch = fetch,
): Promise<string> {
  const nombre = `el flujo «${c.nombre}»`
  const ultimo = [...mensajes].reverse().find((m) => m.rol === 'user')?.texto ?? ''
  try {
    const r = await f(c.url, {
      method: 'POST',
      headers: cabecerasFlujo(c),
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: ultimo, systemPrompt: sistema, messages: mensajes, test: prueba }),
      signal: conTiempo(c.timeoutSeg || 120),
    })
    if (!r.ok) throw new Error(`${nombre} respondió ${r.status}${await detalle(r)}`)
    const bruto = await r.text()
    let datos: unknown = bruto
    try {
      datos = JSON.parse(bruto)
    } catch {
      /* texto plano: se usa tal cual */
    }
    const texto = extraerTexto(datos).trim()
    if (!texto) throw new Error(`${nombre} respondió sin texto (el flujo debe devolver {"output": "…"}).`)
    return texto
  } catch (e) {
    throw errorDeRed(e, nombre)
  }
}

export async function probarFlujo(c: ConexionFlujo, f: Fetch = fetch): Promise<ResultadoPrueba> {
  try {
    await preguntarFlujo(c, 'Prueba de conexión.', [{ rol: 'user', texto: 'ping' }], 'prueba-conexion', true, f)
    return { ok: true, mensaje: 'Conexión probada correctamente: el flujo respondió con texto.' }
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : 'La prueba falló.' }
  }
}
