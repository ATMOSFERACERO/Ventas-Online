import { useState } from 'react'
import Modal from './Modal'
import { listarModelos, probarApi, probarFlujo } from '../assistant/providers'
import {
  AUTH_FLUJO, PLATAFORMAS, PROVEEDORES,
  type AuthFlujo, type Conexion, type ConexionFlujo, type CuentaApi, type Plataforma, type Proveedor, type ResultadoPrueba,
} from '../assistant/types'

interface Props {
  /** Qué se está dando de alta si `editando` es null. */
  tipo: 'api' | 'flujo'
  editando: Conexion | null
  onClose: () => void
  onSave: (c: Conexion) => void
}

const esUrl = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ConexionModal({ tipo, editando, onClose, onSave }: Props) {
  const t = editando?.tipo ?? tipo
  const api = editando?.tipo === 'api' ? editando : null
  const flujo = editando?.tipo === 'flujo' ? editando : null

  const [nombre, setNombre] = useState(editando?.nombre ?? '')
  // Cuenta de API
  const [proveedor, setProveedor] = useState<Proveedor>(api?.proveedor ?? 'anthropic')
  const [host, setHost] = useState(api?.host ?? PROVEEDORES.anthropic.host)
  const [apiKey, setApiKey] = useState(api?.apiKey ?? '')
  const [modelo, setModelo] = useState(api?.modelo ?? PROVEEDORES.anthropic.modelos[0])
  const [modelos, setModelos] = useState<string[]>(PROVEEDORES[api?.proveedor ?? 'anthropic'].modelos)
  // Flujo
  const [plataforma, setPlataforma] = useState<Plataforma>(flujo?.plataforma ?? 'n8n')
  const [url, setUrl] = useState(flujo?.url ?? '')
  const [auth, setAuth] = useState<AuthFlujo>(flujo?.auth ?? 'cabecera')
  const [cabeceraNombre, setCabeceraNombre] = useState(flujo?.cabeceraNombre ?? 'X-Api-Key')
  const [secreto, setSecreto] = useState(flujo?.secreto ?? '')
  const [usuario, setUsuario] = useState(flujo?.usuario ?? '')
  const [timeoutSeg, setTimeoutSeg] = useState(String(flujo?.timeoutSeg ?? 120))

  const [error, setError] = useState('')
  const [prueba, setPrueba] = useState<ResultadoPrueba | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cambiarProveedor = (p: Proveedor) => {
    setProveedor(p)
    setHost(PROVEEDORES[p].host)
    setModelos(PROVEEDORES[p].modelos)
    setModelo(PROVEEDORES[p].modelos[0] ?? '')
  }

  /** Construye la conexión a partir del formulario o devuelve el motivo por el que no es válida. */
  const construir = (): Conexion | string => {
    if (!nombre.trim()) return 'Ponle un nombre a la conexión.'
    if (t === 'api') {
      if (!esUrl(host)) return 'El host debe ser una dirección http(s) válida.'
      if (proveedor !== 'compatible' && !apiKey.trim()) return 'Falta la clave de API.'
      if (!modelo.trim()) return 'Indica el modelo.'
      const c: CuentaApi = { id: editando?.id ?? crypto.randomUUID(), tipo: 'api', nombre: nombre.trim(), proveedor, host: host.trim(), apiKey: apiKey.trim(), modelo: modelo.trim() }
      return c
    }
    if (!esUrl(url)) return 'La URL del flujo debe ser una dirección http(s) válida.'
    if (auth === 'cabecera' && (!cabeceraNombre.trim() || !secreto)) return 'Indica el nombre de la cabecera y su valor.'
    if (auth === 'basic' && (!usuario.trim() || !secreto)) return 'Indica usuario y contraseña.'
    if (auth === 'bearer' && !secreto) return 'Falta el token.'
    const seg = Number(timeoutSeg)
    if (!Number.isFinite(seg) || seg < 5 || seg > 600) return 'El tiempo de espera debe estar entre 5 y 600 segundos.'
    const c: ConexionFlujo = { id: editando?.id ?? crypto.randomUUID(), tipo: 'flujo', nombre: nombre.trim(), plataforma, url: url.trim(), auth, cabeceraNombre: cabeceraNombre.trim(), secreto, usuario: usuario.trim(), timeoutSeg: seg }
    return c
  }

  const probar = async () => {
    const c = construir()
    if (typeof c === 'string') return setError(c)
    setError('')
    setOcupado(true)
    setPrueba(c.tipo === 'api' ? await probarApi(c) : await probarFlujo(c))
    setOcupado(false)
  }

  const cargarModelos = async () => {
    if (!esUrl(host)) return setError('El host debe ser una dirección http(s) válida.')
    setError('')
    setOcupado(true)
    const lista = await listarModelos({ id: 'x', tipo: 'api', nombre, proveedor, host, apiKey, modelo })
    setModelos(lista)
    setOcupado(false)
  }

  const guardar = () => {
    const c = construir()
    if (typeof c === 'string') return setError(c)
    onSave(c)
  }

  const titulo = editando ? `Editar «${editando.nombre}»` : t === 'api' ? 'Añadir cuenta API' : 'Añadir conexión de flujo'

  return (
    <Modal titulo={titulo} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="c-nombre">Nombre</label>
          <input id="c-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t === 'api' ? 'Mi cuenta de Anthropic' : 'Mi flujo de n8n'} />
        </div>

        {t === 'api' ? (
          <>
            <div>
              <label className="label" htmlFor="c-prov">Proveedor</label>
              <select id="c-prov" className="input" value={proveedor} onChange={(e) => cambiarProveedor(e.target.value as Proveedor)}>
                {(Object.keys(PROVEEDORES) as Proveedor[]).map((p) => <option key={p} value={p}>{PROVEEDORES[p].etiqueta}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-host">Host</label>
              <input id="c-host" className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="label" htmlFor="c-key">API Key</label>
              <input id="c-key" className="input" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={PROVEEDORES[proveedor].ayudaClave} />
            </div>
            <div>
              <label className="label" htmlFor="c-modelo">Modelo</label>
              <div className="flex gap-2">
                <input id="c-modelo" className="input" list="lista-modelos" value={modelo} onChange={(e) => setModelo(e.target.value)} />
                <datalist id="lista-modelos">{modelos.map((m) => <option key={m} value={m} />)}</datalist>
                <button type="button" className="btn-ghost btn-sm shrink-0" disabled={ocupado} onClick={cargarModelos}>Cargar modelos</button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Los de la lista son ejemplos; «Cargar modelos» consulta los reales de tu cuenta.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="f-plat">Herramienta</label>
              <select id="f-plat" className="input" value={plataforma} onChange={(e) => setPlataforma(e.target.value as Plataforma)}>
                {(Object.keys(PLATAFORMAS) as Plataforma[]).map((p) => <option key={p} value={p}>{PLATAFORMAS[p].etiqueta}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-url">URL del flujo (webhook de producción)</label>
              <input id="f-url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={PLATAFORMAS[plataforma].ayudaUrl} />
              {plataforma === 'powerautomate' && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Esta URL lleva una firma secreta (sig=…): trátala como una contraseña.</p>}
            </div>
            <div>
              <label className="label" htmlFor="f-auth">Autenticación</label>
              <select id="f-auth" className="input" value={auth} onChange={(e) => setAuth(e.target.value as AuthFlujo)}>
                {(Object.keys(AUTH_FLUJO) as AuthFlujo[]).map((a) => <option key={a} value={a}>{AUTH_FLUJO[a]}</option>)}
              </select>
            </div>
            {auth === 'cabecera' && (
              <div>
                <label className="label" htmlFor="f-cab">Nombre de la cabecera</label>
                <input id="f-cab" className="input" value={cabeceraNombre} onChange={(e) => setCabeceraNombre(e.target.value)} />
              </div>
            )}
            {auth === 'basic' && (
              <div>
                <label className="label" htmlFor="f-usr">Usuario</label>
                <input id="f-usr" className="input" autoComplete="off" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              </div>
            )}
            {auth !== 'ninguna' && (
              <div>
                <label className="label" htmlFor="f-sec">{auth === 'cabecera' ? 'Valor de la cabecera' : auth === 'basic' ? 'Contraseña' : 'Token'}</label>
                <input id="f-sec" className="input" type="password" autoComplete="off" value={secreto} onChange={(e) => setSecreto(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="f-t">Tiempo de espera (segundos)</label>
              <input id="f-t" className="input" type="number" min={5} max={600} value={timeoutSeg} onChange={(e) => setTimeoutSeg(e.target.value)} />
            </div>
          </>
        )}

        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Las claves se guardan solo en este navegador (sin cifrar). Es un prototipo: para un uso real deben guardarse en un servidor.
        </p>

        {prueba && (
          <p role="status" className={`rounded-lg p-3 text-sm ${prueba.ok ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
            {prueba.ok ? '✓ ' : '✗ '}{prueba.mensaje}
          </p>
        )}
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className="btn-ghost btn-sm" disabled={ocupado} onClick={probar}>{ocupado ? 'Probando…' : 'Probar conexión'}</button>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-sm" onClick={guardar}>Guardar</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
