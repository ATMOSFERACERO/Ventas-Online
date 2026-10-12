import { useState } from 'react'
import ConexionModal from '../components/ConexionModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAssistant } from '../assistant/store'
import { probarApi, probarFlujo } from '../assistant/providers'
import { PLATAFORMAS, PROVEEDORES, type Conexion, type CuentaApi, type ResultadoPrueba } from '../assistant/types'

type Pestaña = 'cuentas' | 'flujos'

export default function Ajustes() {
  const [pestaña, setPestaña] = useState<Pestaña>('cuentas')
  const { conexiones, activaId, respaldoId, guardar, borrar, activar, elegirRespaldo } = useAssistant()
  const [modal, setModal] = useState<{ tipo: 'api' | 'flujo'; editando: Conexion | null } | null>(null)
  const [aBorrar, setABorrar] = useState<Conexion | null>(null)
  const [pruebas, setPruebas] = useState<Record<string, ResultadoPrueba | 'probando'>>({})

  const cuentas = conexiones.filter((c): c is CuentaApi => c.tipo === 'api')
  const flujos = conexiones.filter((c) => c.tipo === 'flujo')
  const lista = pestaña === 'cuentas' ? cuentas : flujos

  const probar = async (c: Conexion) => {
    setPruebas((p) => ({ ...p, [c.id]: 'probando' }))
    const r = c.tipo === 'api' ? await probarApi(c) : await probarFlujo(c)
    setPruebas((p) => ({ ...p, [c.id]: r }))
  }

  const pestanaCls = (p: Pestaña) =>
    `rounded-lg px-4 py-2 text-sm font-semibold ${pestaña === p ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">Ajustes del asistente</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        El asistente ayuda a encontrar artículos. Solo una conexión puede estar <strong>activa</strong> a la vez: esa es la que se usa de verdad.
      </p>

      <div role="tablist" className="mt-5 flex gap-2">
        <button role="tab" aria-selected={pestaña === 'cuentas'} className={pestanaCls('cuentas')} onClick={() => setPestaña('cuentas')}>Cuentas de IA</button>
        <button role="tab" aria-selected={pestaña === 'flujos'} className={pestanaCls('flujos')} onClick={() => setPestaña('flujos')}>Flujos (n8n y similares)</button>
      </div>

      {pestaña === 'flujos' && (
        <div className="mt-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">
          Conecta el asistente a un flujo de <strong>n8n</strong>, Fluxion8n, Power Automate u otra herramienta mediante un webhook: el flujo recibe la pregunta y devuelve la respuesta.
          Si falla, la app usa sola la cuenta de respaldo que elijas abajo.{' '}
          <a className="font-semibold underline" href="../Manuales/manual-conexion-flujos.html" target="_blank" rel="noreferrer">Abrir el manual de conexión</a>.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {lista.length === 0 && (
          <p className="tarjeta text-center text-sm text-slate-500 dark:text-slate-400">
            {pestaña === 'cuentas' ? 'Aún no tienes ninguna cuenta de IA dada de alta.' : 'Aún no tienes ninguna conexión de flujo.'}
          </p>
        )}

        {lista.map((c) => {
          const activa = c.id === activaId
          const prueba = pruebas[c.id]
          return (
            <div key={c.id} className={`tarjeta ${activa ? 'tarjeta-activa' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {c.tipo === 'api' ? PROVEEDORES[c.proveedor].etiqueta : PLATAFORMAS[c.plataforma].etiqueta}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700" title="Editar esta conexión" aria-label={`Editar ${c.nombre}`} onClick={() => setModal({ tipo: c.tipo, editando: c })}>✏️</button>
                  <button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700" title="Borrar esta conexión" aria-label={`Borrar ${c.nombre}`} onClick={() => setABorrar(c)}>🗑️</button>
                </div>
              </div>

              {c.tipo === 'api' && (
                <div className="mt-3">
                  <label className="label" htmlFor={`m-${c.id}`}>Modelo</label>
                  <select
                    id={`m-${c.id}`}
                    className="input"
                    disabled={!activa}
                    value={activa ? c.modelo : ''}
                    onChange={(e) => guardar({ ...c, modelo: e.target.value })}
                  >
                    {!activa && <option value="">Actívala para elegir su modelo</option>}
                    {[c.modelo, ...PROVEEDORES[c.proveedor].modelos.filter((m) => m !== c.modelo)].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activa ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-950 dark:text-green-200">✓ Cuenta activa</span>
                ) : (
                  <button className="btn-ghost btn-sm" onClick={() => activar(c.id)}>Activar cuenta</button>
                )}
                <button className="btn-ghost btn-sm" disabled={prueba === 'probando'} onClick={() => probar(c)}>{prueba === 'probando' ? 'Probando…' : 'Probar conexión'}</button>
                {prueba && prueba !== 'probando' && (
                  <span role="status" className={`text-sm ${prueba.ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{prueba.ok ? '✓ ' : '✗ '}{prueba.mensaje}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <button className="btn btn-sm" onClick={() => setModal({ tipo: pestaña === 'cuentas' ? 'api' : 'flujo', editando: null })}>
          + {pestaña === 'cuentas' ? 'Añadir cuenta API' : 'Añadir conexión de flujo'}
        </button>
      </div>

      {pestaña === 'flujos' && (
        <div className="tarjeta mt-6">
          <h2 className="font-bold">Respaldo automático</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Si la conexión activa es un flujo y no responde, la app pasa <strong>sola</strong> a esta cuenta de IA y te lo avisa en el chat.
          </p>
          <label className="label mt-3" htmlFor="respaldo">Cuenta de respaldo</label>
          <select id="respaldo" className="input" value={respaldoId ?? ''} onChange={(e) => elegirRespaldo(e.target.value || null)}>
            <option value="">Ninguna (si el flujo falla, se muestra el error)</option>
            {cuentas.filter((c) => c.id !== activaId).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {cuentas.length === 0 && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Primero da de alta una cuenta de IA en la pestaña «Cuentas de IA».</p>}
        </div>
      )}

      {modal && (
        <ConexionModal
          key={modal.editando?.id ?? 'nueva'}
          tipo={modal.tipo}
          editando={modal.editando}
          onClose={() => setModal(null)}
          onSave={(c) => {
            guardar(c)
            setModal(null)
          }}
        />
      )}
      {aBorrar && (
        <ConfirmDialog
          titulo="Borrar conexión"
          texto={`¿Borrar «${aBorrar.nombre}»? No afecta a nada más. ${aBorrar.id === activaId ? 'Era la conexión activa: el asistente quedará bloqueado hasta que actives otra.' : ''}`}
          confirmar="Borrar"
          onConfirm={() => {
            borrar(aBorrar.id)
            setABorrar(null)
          }}
          onClose={() => setABorrar(null)}
        />
      )}
    </div>
  )
}
