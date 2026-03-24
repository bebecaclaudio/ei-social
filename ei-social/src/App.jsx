import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth, db } from './firebase-config' // Importe o 'db' também
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore' // Importe o onSnapshot para tempo real
import Login from './Login'
import Cadastro from './Cadastro'
import Feed from './feed'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import PaginaComunidade from './PaginaComunidade' 
import GerenciarComunidade from './GerenciarComunidade' 
import Layout from './Layout'

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        border: '4px solid #ddd', borderTop: '4px solid #009c3b',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function RotaPrivada({ children, usuario, carregando }) {
  if (carregando) return <Spinner />
  return usuario ? children : <Navigate to="/" replace />
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // 1. Escuta o estado de Login (Auth)
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 2. Se logado, escuta os dados do Perfil no Firestore (Foto, Nome, etc)
        const docRef = doc(db, "usuarios", user.uid);
        const unsubDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            // Combina os dados do Auth com os dados do Banco de Dados
            setUsuario({ ...user, ...docSnap.data() });
          } else {
            setUsuario(user);
          }
          setCarregando(false);
        });
        
        // Limpa o ouvinte do documento se deslogar
        return () => unsubDoc();
      } else {
        setUsuario(null);
        setCarregando(false);
      }
    });

    return () => unsubAuth();
  }, [])

  async function sair() {
    try {
      await signOut(auth)
    } catch (e) {
      console.error('Erro ao sair:', e)
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          carregando ? <Spinner /> :
          usuario ? <Navigate to="/feed" replace /> :
          <Login />
        } />

        <Route path="/cadastro" element={
          carregando ? <Spinner /> :
          usuario ? <Navigate to="/feed" replace /> :
          <Cadastro />
        } />

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
              <Comunidades usuario={usuario} /> 
            </Layout>
          </RotaPrivada>
        } />

        {/* --- ROTAS DE COMUNIDADE --- */}
        <Route path="/comunidades/:id" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}>
              <PaginaComunidade usuario={usuario} />
            </Layout>
          </RotaPrivada>
        } />

        <Route path="/comunidades/:id/gerenciar" element={
          <RotaPrivada usuario={usuario} carregando={carregando}>
            <Layout usuario={usuario} onSair={sair}>
              <GerenciarComunidade usuario={usuario} />
            </Layout>
          </RotaPrivada>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App;