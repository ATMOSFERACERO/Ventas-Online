import { describe, expect, it, vi } from 'vitest'
import { preguntar } from './preguntar'
import { cabecerasFlujo, extraerTexto, listarModelos, preguntarApi, preguntarFlujo, probarFlujo } from './providers'
import type { ConexionFlujo, CuentaApi } from './types'

const json = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } })

const anthropic: CuentaApi = { id: 'a', tipo: 'api', nombre: 'Claude', proveedor: 'anthropic', host: 'https://api.anthropic.com/', apiKey: 'sk-ant-SECRETA', modelo: 'claude-sonnet-5-5' }
const openai: CuentaApi = { id: 'o', tipo: 'api', nombre: 'OpenAI', proveedor: 'openai', host: 'https://api.openai.com/v1', apiKey: 'sk-SECRETA', modelo: 'gpt-4o-mini' }
const gemini: CuentaApi = { id: 'g', tipo: 'api', nombre: 'Gemini', proveedor: 'gemini', host: 'https://generativelanguage.googleapis.com', apiKey: 'AIzaSECRETA', modelo: 'gemini-2.5-flash' }
const flujo: ConexionFlujo = { id: 'f', tipo: 'flujo', nombre: 'n8n', plataforma: 'n8n', url: 'https://n8n.test/webhook/asistente?sig=FIRMA', auth: 'cabecera', cabeceraNombre: 'X-Api-Key', secreto: 'CLAVE', usuario: '', timeoutSeg: 30 }

describe('cuentas de API', () => {
  it('Anthropic: URL, cabeceras y cuerpo', async () => {
    const f = vi.fn().mockResolvedValue(json({ content: [{ type: 'text', text: 'Hola' }] }))
    expect(await preguntarApi(anthropic, 'sistema', [{ rol: 'user', texto: 'hola' }], f)).toBe('Hola')
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('sk-ant-SECRETA')
    expect(init.headers['anthropic-version']).toBe('2023-06-01')
    const cuerpo = JSON.parse(init.body)
    expect(cuerpo).toMatchObject({ model: 'claude-sonnet-5-5', system: 'sistema', messages: [{ role: 'user', content: 'hola' }] })
  })
  it('OpenAI: system + mensajes y Bearer', async () => {
    const f = vi.fn().mockResolvedValue(json({ choices: [{ message: { content: 'Vale' } }] }))
    expect(await preguntarApi(openai, 'sis', [{ rol: 'user', texto: 'q' }], f)).toBe('Vale')
    expect(f.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions')
    expect(f.mock.calls[0][1].headers.authorization).toBe('Bearer sk-SECRETA')
    expect(JSON.parse(f.mock.calls[0][1].body).messages[0]).toEqual({ role: 'system', content: 'sis' })
  })
  it('Gemini: el rol assistant pasa a model', async () => {
    const f = vi.fn().mockResolvedValue(json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }))
    await preguntarApi(gemini, 's', [{ rol: 'user', texto: 'a' }, { rol: 'assistant', texto: 'b' }, { rol: 'user', texto: 'c' }], f)
    expect(f.mock.calls[0][0]).toContain('/v1beta/models/gemini-2.5-flash:generateContent')
    expect(JSON.parse(f.mock.calls[0][1].body).contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model', 'user'])
  })
  it('un error HTTP no filtra la clave', async () => {
    const f = vi.fn().mockResolvedValue(json({ error: { message: 'clave incorrecta' } }, 401))
    await expect(preguntarApi(anthropic, 's', [{ rol: 'user', texto: 'x' }], f)).rejects.toThrow(/401.*clave incorrecta/)
    await preguntarApi(anthropic, 's', [], f).catch((e: Error) => expect(e.message).not.toContain('SECRETA'))
  })
  it('un fallo de red no filtra la clave y explica las causas', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await preguntarApi(openai, 's', [], f).catch((e: Error) => {
      expect(e.message).toContain('CORS')
      expect(e.message).not.toContain('SECRETA')
    })
  })
  it('listarModelos devuelve los de ejemplo si falla', async () => {
    const f = vi.fn().mockRejectedValue(new Error('x'))
    expect(await listarModelos(anthropic, f)).toContain('claude-sonnet-5-5')
  })
})

describe('flujos', () => {
  it('cabeceras según la autenticación', () => {
    expect(cabecerasFlujo(flujo)['X-Api-Key']).toBe('CLAVE')
    expect(cabecerasFlujo({ ...flujo, auth: 'bearer' }).authorization).toBe('Bearer CLAVE')
    expect(cabecerasFlujo({ ...flujo, auth: 'basic', usuario: 'ana', secreto: 'pw' }).authorization).toBe(`Basic ${btoa('ana:pw')}`)
    expect(cabecerasFlujo({ ...flujo, auth: 'ninguna' }).authorization).toBeUndefined()
  })
  it('Basic admite acentos', () => {
    expect(cabecerasFlujo({ ...flujo, auth: 'basic', usuario: 'ñandú', secreto: 'pw' }).authorization).toMatch(/^Basic /)
  })
  it('envía el contrato y lee output', async () => {
    const f = vi.fn().mockResolvedValue(json({ output: 'respuesta' }))
    expect(await preguntarFlujo(flujo, 'sis', [{ rol: 'user', texto: 'busco bici' }], 's1', false, f)).toBe('respuesta')
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ action: 'sendMessage', sessionId: 's1', chatInput: 'busco bici', systemPrompt: 'sis', test: false })
  })
  it('acepta listas, otros nombres y texto plano', () => {
    expect(extraerTexto([{ output: 'a' }])).toBe('a')
    expect(extraerTexto({ reply: 'b' })).toBe('b')
    expect(extraerTexto('c')).toBe('c')
    expect(extraerTexto({ otra: 1 })).toBe('')
  })
  it('respuesta sin texto = error claro, sin la URL (lleva firma)', async () => {
    const f = vi.fn().mockResolvedValue(json({ nada: true }))
    await preguntarFlujo(flujo, 's', [{ rol: 'user', texto: 'x' }], 'id', false, f).catch((e: Error) => {
      expect(e.message).toContain('{"output"')
      expect(e.message).not.toContain('FIRMA')
    })
  })
  it('probarFlujo marca test: true', async () => {
    const f = vi.fn().mockResolvedValue(json({ output: 'pong' }))
    expect((await probarFlujo(flujo, f)).ok).toBe(true)
    expect(JSON.parse(f.mock.calls[0][1].body).test).toBe(true)
  })
})

describe('respaldo automático', () => {
  const ok = (t: string) => json({ choices: [{ message: { content: t } }] })
  it('si el flujo falla, responde la cuenta de respaldo y avisa', async () => {
    const f = vi.fn().mockResolvedValueOnce(json({}, 500)).mockResolvedValueOnce(ok('desde respaldo'))
    const r = await preguntar(flujo, openai, 's', [{ rol: 'user', texto: 'x' }], 'id', f)
    expect(r.texto).toBe('desde respaldo')
    expect(r.aviso).toContain('500')
    expect(r.aviso).toContain('OpenAI')
  })
  it('si el flujo funciona no se toca el respaldo', async () => {
    const f = vi.fn().mockResolvedValue(json({ output: 'flujo' }))
    const r = await preguntar(flujo, openai, 's', [{ rol: 'user', texto: 'x' }], 'id', f)
    expect(r).toEqual({ texto: 'flujo' })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('sin respaldo, el error del flujo sube tal cual', async () => {
    const f = vi.fn().mockResolvedValue(json({}, 404))
    await expect(preguntar(flujo, null, 's', [{ rol: 'user', texto: 'x' }], 'id', f)).rejects.toThrow(/404/)
  })
  it('si falla una cuenta de API activa no hay respaldo (solo para flujos)', async () => {
    const f = vi.fn().mockResolvedValue(json({}, 500))
    await expect(preguntar(openai, anthropic, 's', [{ rol: 'user', texto: 'x' }], 'id', f)).rejects.toThrow(/500/)
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('si también falla el respaldo, el error recoge ambos motivos', async () => {
    const f = vi.fn().mockResolvedValue(json({}, 500))
    await expect(preguntar(flujo, openai, 's', [{ rol: 'user', texto: 'x' }], 'id', f)).rejects.toThrow(/también falló/)
  })
})
