import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AssistantProvider } from './assistant/store'
import { StoreProvider } from './store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <AssistantProvider>
          <App />
        </AssistantProvider>
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
)
