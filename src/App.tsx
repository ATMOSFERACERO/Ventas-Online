import { Route, Routes } from 'react-router-dom'
import AsistenteChat from './components/AsistenteChat'
import Header from './components/Header'
import Ajustes from './pages/Ajustes'
import Detalle from './pages/Detalle'
import Favoritos from './pages/Favoritos'
import Home from './pages/Home'
import Vender from './pages/Vender'

export default function App() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anuncio/:id" element={<Detalle />} />
          <Route path="/vender" element={<Vender />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <AsistenteChat />
      <footer className="py-8 text-center text-xs text-slate-500">Prototipo de demostración · datos guardados en tu navegador</footer>
    </>
  )
}
