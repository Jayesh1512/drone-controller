import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Desktop from './pages/Desktop'
import Controller from './pages/Controller'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Desktop />} />
        <Route path="/control" element={<Controller />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
