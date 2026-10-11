export const CATEGORIAS = ['Ropa', 'Electrónica', 'Hogar', 'Deporte', 'Libros', 'Juguetes'] as const
export const ESTADOS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable'] as const

export type Categoria = (typeof CATEGORIAS)[number]
export type Estado = (typeof ESTADOS)[number]

export interface Anuncio {
  id: string
  titulo: string
  descripcion: string
  precio: number
  categoria: Categoria
  estado: Estado
  vendedor: string
  ciudad: string
  emoji: string
  fecha: string
}

export const EMOJI_CATEGORIA: Record<Categoria, string> = {
  Ropa: '👕',
  Electrónica: '📱',
  Hogar: '🛋️',
  Deporte: '🚲',
  Libros: '📚',
  Juguetes: '🧸',
}
