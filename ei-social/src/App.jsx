import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './firebase-config'
import { onAuthStateChanged, signOut } from 'firebase/auth'

// Seus Componentes
import Login from './Login'
import Cadastro from './Cadastro'
import Feed from './Feed'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import Layout from './Layout'

// Componente "Segurança" (O AuthRoute)
function RotaPrivada({ children, usuario, carregando }) {
  if (carregando) return null // Espera o Firebase responder
  return usuario ? children : <Navigate to="/" />
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setCarregando(false)
    })
    return unsub
  }, [])

  async function sair() {
    await signOut(auth)
  }

  if (carregando) return (
    <div className="loading-screen">
      <img src="/logo.png" alt="Ei" style={{ width: '150px', animation: 'pulse 1s infinite' }} />
    </div>
  )

  return (
    <Router>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route path="/" element={!usuario ? <Login /> : <Navigate to="/feed" />} />
        <Route path="/Cadastro" element={<Cadastro />} />

        {/* ROTAS PROTEGIDAS (Só entra quem está logado) */}
        <Route path="/Feed" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}><Feed usuario={usuario} /></Layout>
          </RotaPrivada>
        } />

        <Route path="/Perfil" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}><Perfil usuario={usuario} onSair={sair} /></Layout>
          </RotaPrivada>
        } />

        <Route path="/Comunidades" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}><Comunidades /></Layout>
          </RotaPrivada>
        } />
      </Routes>
    </Router>
  )
}

export default App