/** Tipos de las conexiones del asistente: cuentas de API de modelos de IA y conexiones con flujos (n8n y similares). */

export type Proveedor = 'anthropic' | 'openai' | 'gemini' | 'compatible'
export type Plataforma = 'n8n' | 'fluxion8n' | 'powerautomate' | 'otro'
export type AuthFlujo = 'ninguna' | 'cabecera' | 'basic' | 'bearer'

export const PROVEEDORES: Record<Proveedor, { etiqueta: string; host: string; modelos: string[]; ayudaClave: string }> = {
  anthropic: { etiqueta: 'Anthropic (Claude)', host: 'https://api.anthropic.com', modelos: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'], ayudaClave: 'sk-ant-…' },
  openai: { etiqueta: 'OpenAI', host: 'https://api.openai.com/v1', modelos: ['gpt-4o-mini', 'gpt-4o'], ayudaClave: 'sk-…' },
  gemini: { etiqueta: 'Google Gemini', host: 'https://generativelanguage.googleapis.com', modelos: ['gemini-2.5-flash', 'gemini-2.5-pro'], ayudaClave: 'AIza…' },
  compatible: { etiqueta: 'Compatible con OpenAI (otro servidor)', host: '', modelos: [], ayudaClave: '(según el servidor)' },
}

export const PLATAFORMAS: Record<Plataforma, { etiqueta: string; ayudaUrl: string }> = {
  n8n: { etiqueta: 'n8n', ayudaUrl: 'https://TU-N8N/webhook/RUTA' },
  fluxion8n: { etiqueta: 'Fluxion8n', ayudaUrl: 'La URL de producción que muestra el nodo Webhook' },
  powerautomate: { etiqueta: 'Power Automate', ayudaUrl: 'La «HTTP POST URL» del disparador (lleva sig=…)' },
  otro: { etiqueta: 'Otra herramienta de flujos', ayudaUrl: 'https://…' },
}

export const AUTH_FLUJO: Record<AuthFlujo, string> = {
  ninguna: 'Ninguna (la firma ya va en la URL, o solo para pruebas)',
  cabecera: 'Cabecera con clave (Header auth)',
  basic: 'Usuario y contraseña (Basic auth)',
  bearer: 'Token Bearer / JWT',
}

export interface CuentaApi {
  id: string
  tipo: 'api'
  nombre: string
  proveedor: Proveedor
  host: string
  apiKey: string
  modelo: string
}

export interface ConexionFlujo {
  id: string
  tipo: 'flujo'
  nombre: string
  plataforma: Plataforma
  url: string
  auth: AuthFlujo
  /** Nombre de la cabecera (solo con auth = cabecera). */
  cabeceraNombre: string
  /** Valor de la cabecera, contraseña o token, según `auth`. */
  secreto: string
  /** Usuario (solo con auth = basic). */
  usuario: string
  timeoutSeg: number
}

export type Conexion = CuentaApi | ConexionFlujo

export interface Mensaje {
  rol: 'user' | 'assistant'
  texto: string
}

export interface ResultadoPrueba {
  ok: boolean
  mensaje: string
}
