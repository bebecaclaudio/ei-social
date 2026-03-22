import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './firebase-config'
import { onAuthStateChanged, signOut } from 'firebase/auth'

// Importação dos seus Componentes (Mantenha as iniciais maiúsculas aqui)
import Login from './Login'
import Cadastro from './Cadastro'
import Feed from './Feed'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import Layout from './Layout'

// Componente de Proteção (O "Segurança" das rotas)
function RotaPrivada({ children, usuario, carregando }) {
  if (carregando) return null 
  // Se não estiver logado, manda para a raiz (Login)
  return usuario ? children : <Navigate to="/" />
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Vigia o estado do Firebase
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

  // Tela de Carregamento (Logo Pulsando)
  if (carregando) return (
    <div className="loading-screen">
      <img 
        src="/logo.png" 
        alt="Ei" 
        className="pulse-animation" 
        style={{ width: '150px' }} 
      />
    </div>
  )

  return (
    <Router>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        {/* Se já estiver logado, o "/" manda direto para o "/feed" */}
        <Route path="/" element={!usuario ? <Login /> : <Navigate to="/feed" />} />
        
        <Route path="/cadastro" element={<Cadastro />} />

        {/* --- ROTAS PROTEGIDAS (Onde o Layout aparece) --- */}
        <Route path="/feed" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}>
              <Feed usuario={usuario} />
            </Layout>
          </RotaPrivada>
        } />

        <Route path="/perfil" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}>
              <Perfil usuario={usuario} onSair={sair} />
            </Layout>
          </RotaPrivada>
        } />

        <Route path="/comunidades" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}>
              <Comunidades />
            </Layout>
          </RotaPrivada>
        } />

        {/* Rota de segurança: se digitar qualquer coisa errada, volta pro início */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App