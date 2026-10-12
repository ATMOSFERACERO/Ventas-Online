import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { preguntar } from '../assistant/preguntar'
import { useAssistant } from '../assistant/store'
import type { Mensaje } from '../assistant/types'
import { useStore } from '../store'

interface Linea extends Mensaje {
  aviso?: string
  error?: boolean
}

export default function AsistenteChat() {
  const { activa, respaldo, disponible, conexiones } = useAssistant()
  const { anuncios } = useStore()
  const [abierto, setAbierto] = useState(false)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const sesion = useRef(crypto.randomUUID())
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => fin.current?.scrollIntoView?.({ block: 'end' }), [lineas, abierto])

  const motivo = !disponible ? (conexiones.length === 0 ? 'Añade una cuenta de IA o un flujo en Ajustes para usar el asistente.' : 'Activa una conexión en Ajustes para usar el asistente.') : ''

  const sistema = () =>
    'Eres el asistente de una tienda de artículos de segunda mano. Responde siempre en español, de forma breve y amable. ' +
    'Recomienda solo artículos de este catálogo, citando título y precio, y no inventes ninguno:\n' +
    anuncios.slice(0, 40).map((a) => `- ${a.titulo} · ${a.precio} € · ${a.categoria} · ${a.estado} · ${a.ciudad}`).join('\n')

  const enviar = async () => {
    const q = texto.trim()
    if (!q || !activa || enviando) return
    const historial: Mensaje[] = [...lineas.filter((l) => !l.error).map(({ rol, texto }) => ({ rol, texto })), { rol: 'user', texto: q }]
    setLineas((l) => [...l, { rol: 'user', texto: q }])
    setTexto('')
    setEnviando(true)
    try {
      const r = await preguntar(activa, respaldo, sistema(), historial, sesion.current)
      setLineas((l) => [...l, { rol: 'assistant', texto: r.texto, aviso: r.aviso }])
    } catch (e) {
      setLineas((l) => [...l, { rol: 'assistant', texto: e instanceof Error ? e.message : 'No se pudo obtener respuesta.', error: true }])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-40 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600"
        disabled={!disponible}
        title={disponible ? 'Abrir el asistente' : motivo}
        aria-label={disponible ? 'Abrir el asistente' : `Asistente bloqueado. ${motivo}`}
        onClick={() => setAbierto((v) => !v)}
      >
        🤖 Asistente
      </button>

      {abierto && disponible && (
        <section aria-label="Chat del asistente" className="fixed bottom-20 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <header className="flex items-center justify-between bg-brand px-4 py-2 text-white">
            <span className="font-semibold">Asistente · {activa?.nombre}</span>
            <button className="text-sm underline" onClick={() => { setLineas([]); sesion.current = crypto.randomUUID() }}>Nuevo chat</button>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {lineas.length === 0 && <p className="text-slate-500 dark:text-slate-400">Pregúntame, por ejemplo: «¿Qué tenéis de deporte por menos de 150 €?»</p>}
            {lineas.map((l, i) => (
              <div key={i} className={l.rol === 'user' ? 'text-right' : ''}>
                <p className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-left ${l.rol === 'user' ? 'bg-brand text-white' : l.error ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-700'}`}>{l.texto}</p>
                {l.aviso && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">⚠ {l.aviso}</p>}
              </div>
            ))}
            {enviando && <p className="text-slate-500 dark:text-slate-400">Escribiendo…</p>}
            <div ref={fin} />
          </div>
          <form className="flex gap-2 border-t border-slate-200 p-2 dark:border-slate-700" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
            <input className="input" aria-label="Mensaje" placeholder="Escribe tu pregunta…" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button className="btn btn-sm" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
          </form>
        </section>
      )}

      {!disponible && (
        <p className="fixed bottom-20 right-5 z-30 max-w-[16rem] rounded-lg bg-slate-800 p-2 text-xs text-white shadow dark:bg-slate-100 dark:text-slate-900">
          {motivo} <Link to="/ajustes" className="font-semibold underline">Ir a Ajustes</Link>
        </p>
      )}
    </>
  )
}
